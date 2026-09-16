import clsx from "clsx";

const Prose = ({ html, className }: { html: string; className?: string }) => {
  return (
    <div
      className={clsx(
        "prose mx-auto max-w-6xl text-base leading-7 text-foreground prose-headings:mt-8 prose-headings:font-semibold prose-headings:tracking-wide prose-headings:text-foreground prose-h1:text-5xl prose-h2:text-4xl prose-h3:text-3xl prose-h4:text-2xl prose-h5:text-xl prose-h6:text-lg prose-a:text-[#0071e3] prose-a:underline hover:prose-a:text-[#1d1d1f] prose-strong:text-foreground prose-ol:mt-8 prose-ol:list-decimal prose-ol:pl-6 prose-ul:mt-8 prose-ul:list-disc prose-ul:pl-6 dark:text-white dark:prose-headings:text-white dark:prose-a:text-[#0071e3] dark:prose-strong:text-white",
        className,
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: <Prose needs this>
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default Prose;
