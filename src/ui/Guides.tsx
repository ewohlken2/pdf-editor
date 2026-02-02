type Guide = { x?: number; y?: number };

type Props = {
  guides: Guide[];
};

export default function Guides({ guides }: Props) {
  return (
    <div className="guides">
      {guides.map((guide, index) => (
        <div
          key={index}
          className="guide"
          style={{
            left: guide.x,
            top: guide.y
          }}
        />
      ))}
    </div>
  );
}
