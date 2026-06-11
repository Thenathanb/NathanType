interface MemeReactionProps {
  wpm: number;
}

const REACTIONS = [
  { max: 30,  text: 'you cooked but slowly' },
  { max: 50,  text: 'solid drip no cap' },
  { max: 70,  text: 'based and sigma pilled' },
  { max: 90,  text: 'you are built different fr fr' },
  { max: Infinity, text: 'GYATT. absolute unit. no shot you typed that' },
];

export function MemeReaction({ wpm }: MemeReactionProps) {
  const reaction = REACTIONS.find(r => wpm < r.max)!;

  return (
    <div
      className="text-center font-mono py-3 px-4 rounded-xl"
      style={{ backgroundColor: '#323437', animation: 'fadeIn 0.3s ease-out' }}
    >
      <div style={{ color: '#e2b714', fontSize: 15, fontWeight: 500 }}>
        {reaction.text}
      </div>
    </div>
  );
}
