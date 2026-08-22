"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <div className="not-found"><span className="eyebrow">The signal broke</span><h1>Something moved in the dark</h1><p>The page could not be loaded. Your cart remains on this device.</p><button className="button button-primary" onClick={reset}>Try again</button></div>; }
