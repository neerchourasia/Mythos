# Mythos: Chronicles of the Pantheon

A browser game about 14 Greek gods and 18 mortals. Finish every god mission to open the Mortal Quests; finish those to unlock the final level of the Myth Codex. Pick a god's mission on the map, read the passage and answer the question to earn a one-time Divine Favor boost, then fight a turn-based battle: read the enemy's intent, counter it with Guard or Dodge, build Focus for your special move. The first win in each quest lets you choose a permanent blessing (switch them off on the prep screen for a pure challenge). Sound effects and music are synthesized in the browser, with mute buttons in the top corner.

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
| `mortals.js` | the 18 mortal quests: story, quiz, enemy, moves and special move |
| `sound.js` | synthesized sound effects and music (WebAudio, no audio files) |
| `engine.js` | turn-based battle rules (no page code) |
| `ui.js` | map, preparation and mission screens |
| `build.py` | joins the above into `index.html` (`cd src && python3 build.py`) |
