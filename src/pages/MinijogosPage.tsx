import { useState, useEffect, useCallback } from 'react';
import type { TouchEvent as ReactTouchEvent } from 'react';
import { Gamepad2, Heart, Puzzle, Brain, Trophy, RotateCcw, Check, X } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { getEffectivePlan } from '@/lib/plans';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabase';
import type { HangmanGame, PuzzleGame, QuizGroup, QuizQuestion } from '@/lib/supabase';
import { GuestBanner } from '@/components/GuestBanner';
import { addPendingGame, addPendingDantes } from '@/lib/pendingRewards';

type GameTab = 'forca' | 'quebra' | 'quiz';

export function MinijogosPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<GameTab>('forca');

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {!user && <GuestBanner />}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500">
          <Gamepad2 size={28} className="text-white" />
        </div>
        <h1 className="font-display text-3xl font-bold text-grape-50 sm:text-4xl">Minijogos</h1>
        <p className="mt-3 text-grape-200/60">Jogue, divirta-se e ganhe Dantes!</p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex justify-center gap-2 rounded-2xl border border-white/10 bg-ink-800/40 p-1.5">
        {([
          { key: 'forca', label: 'Forca', icon: Heart },
          { key: 'quebra', label: 'Quebra-Cabeça', icon: Puzzle },
          { key: 'quiz', label: 'Quiz', icon: Brain },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
              tab === key
                ? 'bg-gradient-to-r from-grape-500 to-rose-500 text-white'
                : 'text-grape-200/60 hover:text-grape-50'
            }`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'forca' && <HangmanGame_ />}
      {tab === 'quebra' && <PuzzleGame_ />}
      {tab === 'quiz' && <QuizGame_ />}
    </div>
  );
}

// ===================== HANGMAN =====================
function HangmanGame_() {
  const { user, profile, refreshProfile } = useAuth();
  const rewardMultiplier = profile && getEffectivePlan(profile) !== 'free' ? 2 : 1;
  const { toast } = useToast();
  const [games, setGames] = useState<HangmanGame[]>([]);
  const [current, setCurrent] = useState<HangmanGame | null>(null);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [wrongCount, setWrongCount] = useState(0);
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('hangman_games')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setGames((data as HangmanGame[]) ?? []);
        setLoading(false);
      });
  }, []);

  const startGame = (g: HangmanGame) => {
    setCurrent(g);
    setGuessed(new Set());
    setWrongCount(0);
    setWon(false);
    setLost(false);
  };

  const MAX_WRONG = 6;

  const handleGuess = (letter: string) => {
    if (!current || won || lost || guessed.has(letter)) return;
    const newGuessed = new Set(guessed);
    newGuessed.add(letter);
    setGuessed(newGuessed);

    const word = current.secret_word.toUpperCase();
    if (!word.includes(letter)) {
      const newWrong = wrongCount + 1;
      setWrongCount(newWrong);
      if (newWrong >= MAX_WRONG) {
        setLost(true);
      }
    } else {
      const allFound = word.split('').every((ch) => ch === ' ' || newGuessed.has(ch));
      if (allFound) {
        setWon(true);
        awardWin('hangman', current.id, current.reward_dantes);
      }
    }
  };

  const awardWin = async (gameType: string, gameId: string, baseReward: number) => {
    const reward = baseReward * rewardMultiplier;
    if (!user) {
      addPendingGame(gameType, gameId, reward);
      addPendingDantes(reward);
      toast(`Você venceu! +${reward} Dantes (salvo - faça login para confirmar)!`, 'success');
      return;
    }
    try {
      const { data, error } = await supabase.rpc('award_game_win', {
        p_game_type: gameType,
        p_game_id: gameId,
        p_reward: reward,
      });
      if (error) throw error;
      const result = data as { success: boolean; reason?: string };
      if (result.success) {
        toast(`Você venceu! +${reward} Dantes creditados!`, 'success');
        await refreshProfile();
      } else if (result.reason === 'already_won') {
        toast(`Você venceu! (Dantes já resgatados anteriormente)`, 'info');
      }
    } catch {
      toast('Erro ao creditar recompensa.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-3">
        {games.length === 0 ? (
          <p className="text-center text-grape-200/50">Nenhum jogo da forca disponível no momento.</p>
        ) : (
          games.map((g) => (
            <button
              key={g.id}
              onClick={() => startGame(g)}
              className="card flex w-full items-center justify-between border border-white/10 bg-ink-800/40 p-4 transition hover:border-grape-400/30"
            >
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-rose-400" />
                <span className="font-medium text-grape-50">Forca #{g.sort_order ?? g.created_at.slice(0, 10)}</span>
              </div>
              <span className="flex items-center gap-1 text-sm text-gold-400">
                <Trophy size={14} /> {g.reward_dantes} Dantes
              </span>
            </button>
          ))
        )}
      </div>
    );
  }

  const word = current.secret_word.toUpperCase();
  const display = word.split('').map((ch) => (ch === ' ' ? ' ' : guessed.has(ch) ? ch : '_'));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="card border border-white/10 bg-ink-800/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setCurrent(null)} className="text-sm text-grape-200/50 hover:text-grape-200">
          ← Voltar
        </button>
        <span className="flex items-center gap-1 text-sm text-gold-400">
          <Trophy size={14} /> {current.reward_dantes} Dantes
        </span>
      </div>

      <p className="mb-4 text-center text-sm text-grape-200/60">
        Dica: <span className="italic text-grape-100">{current.hint}</span>
      </p>

      {/* Hearts */}
      <div className="mb-6 flex justify-center gap-1.5">
        {Array.from({ length: MAX_WRONG }).map((_, i) => (
          <Heart
            key={i}
            size={22}
            className={i < MAX_WRONG - wrongCount ? 'fill-rose-500 text-rose-500' : 'text-grape-200/20'}
          />
        ))}
      </div>

      {/* Word display */}
      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {display.map((ch, i) => (
          <span
            key={i}
            className="flex h-10 w-8 items-center justify-center border-b-2 border-grape-300/40 font-display text-xl font-bold text-grape-50"
          >
            {ch === ' ' ? '' : ch}
          </span>
        ))}
      </div>

      {/* Status */}
      {won && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-center text-emerald-400">
          <Check size={20} className="mb-1 inline" /> Você venceu! +{current.reward_dantes} Dantes!
        </div>
      )}
      {lost && (
        <div className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-center text-red-400">
          <X size={20} className="mb-1 inline" /> Você perdeu! A palavra era: {word}
        </div>
      )}

      {/* Keyboard */}
      {(won || lost) ? (
        <div className="flex justify-center">
          <button onClick={() => startGame(current)} className="btn-ghost">
            <RotateCcw size={16} /> Jogar Novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
          {alphabet.map((letter) => {
            const isGuessed = guessed.has(letter);
            const isWrong = isGuessed && !word.includes(letter);
            const isRight = isGuessed && word.includes(letter);
            return (
              <button
                key={letter}
                onClick={() => handleGuess(letter)}
                disabled={isGuessed}
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition ${
                  isRight
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isWrong
                    ? 'bg-red-500/20 text-red-400'
                    : 'border border-white/10 bg-ink-700/50 text-grape-50 hover:border-grape-400/40'
                } disabled:cursor-default`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===================== PUZZLE (drag & drop, troca livre de peças) =====================
function PuzzleGame_() {
  const { user, profile, refreshProfile } = useAuth();
  const rewardMultiplier = profile && getEffectivePlan(profile) !== 'free' ? 2 : 1;
  const { toast } = useToast();
  const [games, setGames] = useState<PuzzleGame[]>([]);
  const [current, setCurrent] = useState<PuzzleGame | null>(null);
  const [pieces, setPieces] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [moves, setMoves] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('puzzle_games')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setGames((data as PuzzleGame[]) ?? []);
        setLoading(false);
      });
  }, []);

  const startGame = (g: PuzzleGame) => {
    setCurrent(g);
    setSolved(false);
    setMoves(0);
    setDragIndex(null);
    setOverIndex(null);
    const n = Math.max(4, g.piece_count);
    // peças 1..n, todas independentes (sem espaço vazio)
    const arr = Array.from({ length: n }, (_, i) => i + 1);
    do {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    } while (arr.every((v, i) => v === i + 1));
    setPieces(arr);
  };

  const gridCols = current ? Math.ceil(Math.sqrt(Math.max(4, current.piece_count))) : 3;

  const swap = (from: number, to: number) => {
    if (solved || from === to) return;
    const next = [...pieces];
    [next[from], next[to]] = [next[to], next[from]];
    setPieces(next);
    setMoves((m) => m + 1);
    if (next.every((v, i) => v === i + 1)) {
      setSolved(true);
      awardWin();
    }
  };

  // --- mouse (HTML5 drag) ---
  const onDragStart = (i: number) => setDragIndex(i);
  const onDrop = (i: number) => {
    if (dragIndex !== null) swap(dragIndex, i);
    setDragIndex(null);
    setOverIndex(null);
  };

  // --- touch ---
  const onTouchStart = (i: number) => setDragIndex(i);
  const onTouchMove = (e: ReactTouchEvent) => {
    const t = e.touches[0];
    const el = document.elementFromPoint(t.clientX, t.clientY) as HTMLElement | null;
    const idxAttr = el?.closest('[data-piece-index]')?.getAttribute('data-piece-index');
    setOverIndex(idxAttr != null ? Number(idxAttr) : null);
  };
  const onTouchEnd = () => {
    if (dragIndex !== null && overIndex !== null) swap(dragIndex, overIndex);
    setDragIndex(null);
    setOverIndex(null);
  };

  const awardWin = async () => {
    if (!current) return;
    const reward = current.reward_dantes * rewardMultiplier;
    if (!user) {
      addPendingGame('puzzle', current.id, reward);
      addPendingDantes(reward);
      toast(`Quebra-cabeça resolvido! +${reward} Dantes (salvo - faça login para confirmar)!`, 'success');
      return;
    }
    try {
      const { data, error } = await supabase.rpc('award_game_win', {
        p_game_type: 'puzzle',
        p_game_id: current.id,
        p_reward: reward,
      });
      if (error) throw error;
      const result = data as { success: boolean; reason?: string };
      if (result.success) {
        toast(`Quebra-cabeça resolvido! +${reward} Dantes!`, 'success');
        await refreshProfile();
      } else if (result.reason === 'already_won') {
        toast(`Quebra-cabeça resolvido! (Dantes já resgatados)`, 'info');
      }
    } catch {
      toast('Erro ao creditar recompensa.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-3">
        {games.length === 0 ? (
          <p className="text-center text-grape-200/50">Nenhum quebra-cabeça disponível no momento.</p>
        ) : (
          games.map((g) => (
            <button
              key={g.id}
              onClick={() => startGame(g)}
              className="card flex w-full items-center justify-between border border-white/10 bg-ink-800/40 p-4 transition hover:border-grape-400/30"
            >
              <div className="flex items-center gap-3">
                <Puzzle size={20} className="text-sky-400" />
                <span className="font-medium text-grape-50">Quebra-Cabeça ({g.piece_count} peças)</span>
              </div>
              <span className="flex items-center gap-1 text-sm text-gold-400">
                <Trophy size={14} /> {g.reward_dantes} Dantes
              </span>
            </button>
          ))
        )}
      </div>
    );
  }

  const imageUrl = current.image_url;

  return (
    <div className="card border border-white/10 bg-ink-800/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setCurrent(null)} className="text-sm text-grape-200/50 hover:text-grape-200">
          ← Voltar
        </button>
        <span className="flex items-center gap-1 text-sm text-gold-400">
          <Trophy size={14} /> {current.reward_dantes} Dantes
        </span>
      </div>

      <div className="mb-4 text-center">
        <p className="text-sm text-grape-200/60">Movimentos: {moves}</p>
      </div>

      {solved && (
        <div className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-center text-emerald-400">
          <Check size={20} className="mb-1 inline" /> Resolvido em {moves} movimentos! +
          {current.reward_dantes * rewardMultiplier} Dantes!
        </div>
      )}

      <div
        className="mx-auto grid touch-none gap-1.5 rounded-xl bg-ink-950/40 p-2"
        style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)`, maxWidth: '360px' }}
      >
        {pieces.map((val, i) => {
          const total = pieces.length;
          const rows = Math.ceil(total / gridCols);
          const srcRow = Math.floor((val - 1) / gridCols);
          const srcCol = (val - 1) % gridCols;
          const isDragging = dragIndex === i;
          const isOver = overIndex === i && dragIndex !== null && dragIndex !== i;
          return (
            <div
              key={i}
              data-piece-index={i}
              draggable={!solved}
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIndex(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(i);
              }}
              onDragEnd={() => {
                setDragIndex(null);
                setOverIndex(null);
              }}
              onTouchStart={() => onTouchStart(i)}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
              className={`relative flex aspect-square cursor-grab select-none items-center justify-center overflow-hidden rounded-lg border text-lg font-bold text-white transition active:cursor-grabbing ${
                isDragging
                  ? 'scale-95 border-gold-400/70 opacity-70'
                  : isOver
                    ? 'border-gold-400 ring-2 ring-gold-400/60'
                    : 'border-white/10'
              } ${imageUrl ? 'bg-ink-900' : 'bg-gradient-to-br from-grape-500/60 to-rose-500/60'}`}
              style={
                imageUrl
                  ? {
                      backgroundImage: `url(${imageUrl})`,
                      backgroundSize: `${gridCols * 100}% ${rows * 100}%`,
                      backgroundPosition: `${gridCols > 1 ? (srcCol / (gridCols - 1)) * 100 : 0}% ${
                        rows > 1 ? (srcRow / (rows - 1)) * 100 : 0
                      }%`,
                    }
                  : undefined
              }
            >
              {imageUrl ? (
                <span className="pointer-events-none absolute bottom-1 right-1.5 text-xs font-bold text-white/80 drop-shadow">
                  {val}
                </span>
              ) : (
                <span className="pointer-events-none">{val}</span>
              )}
            </div>
          );
        })}
      </div>

      {solved && (
        <div className="mt-4 flex justify-center">
          <button onClick={() => startGame(current)} className="btn-ghost">
            <RotateCcw size={16} /> Jogar Novamente
          </button>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-grape-200/40">
        Arraste uma peça sobre a outra para trocá-las de lugar. Organize as peças em ordem para concluir.
      </p>
    </div>
  );
}


// ===================== QUIZ =====================
function QuizGame_() {
  const { user, profile, refreshProfile } = useAuth();
  const rewardMultiplier = profile && getEffectivePlan(profile) !== 'free' ? 2 : 1;
  const { toast } = useToast();
  const [groups, setGroups] = useState<QuizGroup[]>([]);
  const [current, setCurrent] = useState<QuizGroup | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('quiz_groups')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setGroups((data as QuizGroup[]) ?? []);
        setLoading(false);
      });
  }, []);

  const startQuiz = async (g: QuizGroup) => {
    setCurrent(g);
    setQIndex(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('group_id', g.id)
      .order('sort_order', { ascending: true });
    setQuestions((data as QuizQuestion[]) ?? []);
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[qIndex].correct_index) {
      setScore(score + 1);
    }

    setTimeout(() => {
      if (qIndex + 1 < questions.length) {
        setQIndex(qIndex + 1);
        setSelected(null);
      } else {
        setFinished(true);
        // All correct = win
        const finalScore = score + (idx === questions[qIndex].correct_index ? 1 : 0);
        if (finalScore === questions.length && current) {
          awardWin(current.id, current.reward_dantes);
        }
      }
    }, 1200);
  };

  const awardWin = async (gameId: string, baseReward: number) => {
    const reward = baseReward * rewardMultiplier;
    if (!user) {
      addPendingGame('quiz', gameId, reward);
      addPendingDantes(reward);
      toast(`Quiz perfeito! +${reward} Dantes (salvo - faça login para confirmar)!`, 'success');
      return;
    }
    try {
      const { data, error } = await supabase.rpc('award_game_win', {
        p_game_type: 'quiz',
        p_game_id: gameId,
        p_reward: reward,
      });
      if (error) throw error;
      const result = data as { success: boolean; reason?: string };
      if (result.success) {
        toast(`Quiz perfeito! +${reward} Dantes!`, 'success');
        await refreshProfile();
      } else if (result.reason === 'already_won') {
        toast(`Quiz perfeito! (Dantes já resgatados)`, 'info');
      }
    } catch {
      toast('Erro ao creditar recompensa.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="space-y-3">
        {groups.length === 0 ? (
          <p className="text-center text-grape-200/50">Nenhum quiz disponível no momento.</p>
        ) : (
          groups.map((g) => (
            <button
              key={g.id}
              onClick={() => startQuiz(g)}
              className="card flex w-full items-center justify-between border border-white/10 bg-ink-800/40 p-4 transition hover:border-grape-400/30"
            >
              <div>
                <div className="flex items-center gap-3">
                  <Brain size={20} className="text-emerald-400" />
                  <span className="font-medium text-grape-50">{g.title}</span>
                </div>
                {g.description && <p className="mt-1 text-xs text-grape-200/50">{g.description}</p>}
              </div>
              <span className="flex items-center gap-1 text-sm text-gold-400">
                <Trophy size={14} /> {g.reward_dantes} Dantes
              </span>
            </button>
          ))
        )}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center">
        <p className="text-grape-200/50">Nenhuma pergunta neste quiz ainda.</p>
        <button onClick={() => setCurrent(null)} className="mt-4 text-sm text-grape-200/50 hover:text-grape-200">
          ← Voltar
        </button>
      </div>
    );
  }

  if (finished) {
    const allCorrect = score === questions.length;
    return (
      <div className="card border border-white/10 bg-ink-800/40 p-8 text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${allCorrect ? 'bg-emerald-500/15' : 'bg-grape-500/15'}`}>
          {allCorrect ? <Trophy size={32} className="text-emerald-400" /> : <Brain size={32} className="text-grape-300" />}
        </div>
        <h3 className="mb-2 font-display text-xl font-semibold text-grape-50">
          {allCorrect ? 'Perfeito!' : 'Quiz Concluído!'}
        </h3>
        <p className="mb-6 text-grape-200/60">
          Você acertou {score} de {questions.length} perguntas.
        </p>
        {allCorrect && (
          <p className="mb-4 text-sm text-gold-400">+{current.reward_dantes} Dantes creditados!</p>
        )}
        <div className="flex justify-center gap-3">
          <button onClick={() => startQuiz(current)} className="btn-ghost">
            <RotateCcw size={16} /> Tentar Novamente
          </button>
          <button onClick={() => setCurrent(null)} className="btn-primary">
            Outros Quizzes
          </button>
        </div>
      </div>
    );
  }

  const q = questions[qIndex];

  return (
    <div className="card border border-white/10 bg-ink-800/40 p-6">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setCurrent(null)} className="text-sm text-grape-200/50 hover:text-grape-200">
          ← Sair
        </button>
        <span className="text-sm text-grape-200/50">
          {qIndex + 1} / {questions.length}
        </span>
      </div>

      <h3 className="mb-6 font-display text-lg font-semibold text-grape-50">{q.question}</h3>

      <div className="space-y-2.5">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct_index;
          const isSelected = i === selected;
          let style = 'border-white/10 bg-ink-700/40 text-grape-50 hover:border-grape-400/30';
          if (selected !== null) {
            if (isCorrect) style = 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300';
            else if (isSelected) style = 'border-red-400/50 bg-red-500/15 text-red-300';
            else style = 'border-white/5 bg-ink-700/20 text-grape-200/40';
          }
          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${style}`}
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
              {selected !== null && isCorrect && <Check size={18} className="ml-auto" />}
              {selected !== null && isSelected && !isCorrect && <X size={18} className="ml-auto" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
