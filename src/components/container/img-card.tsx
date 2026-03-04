

export interface ImgCardProps {
  src: string;
  alt: string;
}

export function ImgCard(props: ImgCardProps) {
  return (
    <div className="w-full bg-background p-3">
      <h1 className="text-lg text-foreground">相关监控图片</h1>
      <div className="w-full h-full pt-4">
        <img src={props.src} alt={props.alt} className="w-full h-56 object-cover" />
      </div>
    </div>
  );
}
