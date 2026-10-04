export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 py-6 px-4 text-sm text-muted-foreground">
        <p>© 2026 QPForge – Smart Question Paper Generator. For educational purposes only.</p>
        <p>Built with Next.js, Express, Prisma &amp; Claude AI</p>
      </div>
    </footer>
  );
}