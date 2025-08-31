export function ProfileHello() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted p-2 md:p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold mb-4">Hello!</h1>
          <p className="text-muted-foreground text-lg">
            Welcome to the profile page. This is a public route.
          </p>
        </div>
      </div>
    </div>
  );
}
