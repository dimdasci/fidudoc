interface InboxHeaderProps {
  title: string;
  subtitle: string;
}

export function InboxHeader({ title, subtitle }: InboxHeaderProps) {
  return (
    <div className="mb-6">
      <div className="space-y-1">
        <h2 className="text-headline font-semibold text-primary">
          {title}
        </h2>
        <p className="text-body text-secondary">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
