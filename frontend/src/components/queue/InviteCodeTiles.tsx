interface InviteCodeTilesProps {
  code: string;
}

export function InviteCodeTiles({ code }: InviteCodeTilesProps) {
  return (
    <div className="invite-code-tiles">
      {code.split("").map((char, i) => (
        <span key={i} className="invite-code-tile" style={{ animationDelay: `${i * 0.06}s` }}>
          {char}
        </span>
      ))}
    </div>
  );
}
