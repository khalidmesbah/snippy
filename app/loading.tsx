export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-muted rounded-full animate-spin border-t-primary mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Loading Snippy</h2>
          <p className="text-muted-foreground">Preparing your code snippets...</p>
        </div>
      </div>
    </div>
  )
}
