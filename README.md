# Procedural Space Explorer

This project is a small browser game written in plain JavaScript. It renders an endless galaxy on a full window canvas and procedurally generates textures for every planet, ship and star field. Simply open `index.html` in a modern browser or run a simple web server such as `python3 -m http.server` to play.


## Gameplay

- **Movement:** Use the arrow keys or **WASD** to control your thrusters. Movement has inertia so you'll drift unless you counter-thrust.
- **Combat:** Press **Space** or click to fire your cannons. Weapons build heat and temporarily lock when the meter reaches 100%, so let them cool before shooting again.
- **Landing:** Press **E** near a planet to land. A short animation moves the ship to the planet's center once you are within 10% of its radius. Landed vendor worlds automatically trade Ore for credits and may offer randomized cargo delivery missions.
- **Harvesting & Building:** While landed press **H** to gather Metal and Carbon on resource worlds. Press **B** to place a base module (requires 10 Ore, 5 Metal and 5 Carbon) and **R** to rotate it. Bases are stored locally and appear as brown squares on planets and on the radar.
- **Radar:** A minimap in the upper right shows nearby planets and clicking one instantly warps your ship to its location.

## World Generation

 - Stars appear randomly between **500** and **2000** units from the previous system and are generated outside your view. Each system hosts between one and nine planets on wide, non‑colliding orbits.

- Planet sizes vary with a standard deviation near 100 units. Planet colors hint at available resources. Some planets replenish fuel, oxygen or food when you land.
- Enemy ships spawn roughly every thirty seconds and take 5–15 shots to destroy, rewarding **200 credits** each.
- Planets are protected by 1–10 defense turrets depending on size. Turrets have 3–10 hit points and a one‑second cooldown between shots, opening fire on your ship if you fly within ten planetary radii.
- Clearing all turrets on a planet and landing there for the first time upgrades your ship with additional cannons, letting you fire more bullets at once.

## Miscellaneous

- Touch controls provide a joystick and buttons on mobile devices.
- Health and resource meters appear in the upper left along with your X,Y coordinates. Inventory and key bindings are shown at the bottom left.
- The map is infinite—wander as far as you like. The minimap always points toward the nearest star.
- Touching a star slowly damages your ship, while landing heals and refuels you. If you are destroyed a random sci‑fi message displays before you respawn near the closest star.

Enjoy exploring the galaxy!
