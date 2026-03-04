


export function TitleBar({ children }: React.PropsWithChildren) {


  return (
    <div className="h-26 bg-background flex items-center px-6 text-2xl fixed w-full top-0 left-0 right-0">
      <h1 className="pt-10">{children}</h1>
    </div>
  )
}