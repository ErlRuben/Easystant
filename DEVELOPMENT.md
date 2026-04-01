# Easystant Development Guide - Version 1

## Project Structure

```
Easystant/
├── src/
│   ├── features/
│   │   ├── fixChat.js          # Communication improvement feature
│   │   └── createTask.js       # Task extraction feature
│   ├── utils/
│   │   ├── api.js              # API calls to AI service
│   │   └── storage.js          # Chrome storage management
│   ├── styles/
│   │   └── panel.css           # Extension panel styling
│   ├── panel.js                # Extension panel logic
│   ├── content-script.js       # Runs on web pages
│   └── background.js           # Service worker
├── public/
│   ├── manifest.json           # Extension configuration
│   ├── panel.html              # Extension UI
│   └── icons/                  # Extension icons
├── PLAN.md                     # Project roadmap
├── README.md                   # Project overview
├── package.json                # Dependencies
└── .gitignore                  # Git ignore rules
```

## Getting Started

### 1. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Navigate to the `Easystant` folder
5. The extension should now appear in your Chrome toolbar

### 2. Test the Features

**Fix Chat:**
- Highlight any text on a webpage
- Right-click and select "Fix Chat with Easystant"
- The extension panel opens and shows tone selection buttons
- Choose your preferred tone: **Casual**, **Professional**, or **Simple**
- Get the improved message in your selected tone

**Create Task:**
- Highlight text
- Right-click and select "Create Task with Easystant"
- Get a structured task with title, description, and priority
- Results appear immediately in the panel

### 3. Configure API

To enable AI features:

1. Get an API key from OpenAI or your preferred AI service
2. Update `API_ENDPOINT` and `API_KEY` in `src/utils/api.js`
3. Or set `REACT_APP_API_KEY` environment variable

Currently, placeholder responses are used when API is not configured.

## Version 1 (MVP) Features

- ✅ **Fix Chat**: Improve message tone and clarity with selectable tones (casual, professional, simple)
- ✅ **Create Task**: Extract actionable tasks with priority
- ✅ **Basic Panel**: Clean UI to display results
- ✅ **Tone Selection**: Choose your preferred message tone before generating
- ✅ **Copy Functionality**: Copy results to clipboard
- ✅ **Context Menu**: Right-click options on any website

## Next Steps (Version 2+)

- [ ] Implement history system with localStorage
- [ ] Enhanced task priority suggestions
- [ ] Cloud sync with Supabase
- [ ] Settings panel for tone preferences

## Debugging

- Right-click extension → "Inspect popup" for panel.js issues
- Open DevTools on any webpage for content-script.js issues
- Check `chrome://extensions/` background service worker for background.js

## Notes

- All generated outputs are automatically saved to Chrome storage
- Currently using placeholder AI responses - integrate with API for production
- Maximum 50 items kept in history to avoid storage limits
