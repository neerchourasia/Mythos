# Mythos: Chronicles of the Pantheon

A browser game about 14 Greek gods. Pick a god's mission on the map, read the passage and answer the question to earn a one-time Divine Favor boost, then fight a turn-based battle: read the enemy's intent, counter it with Guard or Dodge, build Focus for your special move.

## Play
Open `index.html` in a browser. No install, no internet needed.

## Source
The game is built from the files in `src/`:

| File | Contents |
|---|---|
| `shell.html` | page skeleton |
| `style.css` | styling and animations |
| `text.js` | lore and quiz text for each god |
| `config.js` | each god's mission, enemy, moves and special move |
| `engine.js` | turn-based battle rules (no page code) |
| `ui.js` | map, preparation and mission screens |
| `build.py` | joins the above into `index.html` (`cd src && python3 build.py`) |
