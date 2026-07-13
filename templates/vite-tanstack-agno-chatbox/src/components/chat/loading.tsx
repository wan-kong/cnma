/**
 * Chat page skeleton loading
 * Mimics the chat interface layout with placeholder elements
 */
const Loading = () => {
  const letters = ["A", "g", "n", "o"];
  return (
    <div className="flex h-full items-center justify-center gap-1">
      {letters.map((letter, index) => (
        <span
          key={letter}
          className="animate-pulse-glow font-bold text-8xl md:text-9xl"
          style={{
            animationDelay: `${index * 0.25}s`,
          }}
        >
          {letter}
        </span>
      ))}
    </div>
  );
};

export default Loading;
