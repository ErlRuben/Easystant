## Claude Setup
- You top up credits, users get AI for free
- $5 lasts ~5,000 requests
- Good for personal use or small user base

For Claude Version Chrome Extension Git History in Github


## Gemini Setup
- create table history (
    id uuid default gen_random_uuid() primary key,
    type text not null check (type in ('fixChat', 'createTask')),
    output text not null,
    preview text not null,
    created_at timestamp with time zone default now()
);
- Excelent for personal use or small user base