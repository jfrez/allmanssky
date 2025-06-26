# Procedural Space Explorer

This project is a small browser game written in pure JavaScript. It draws an
endless galaxy and generates textures for every planet, ship and the starry
background on the fly. Use the arrow keys or WASD to fire your thrusters.
Thruster flames animate while keys are held down so you can tell which jets are
firing. Movement has inertia, so you'll drift through space unless you
counter-thrust.
Enemy ships now spawn frequently (about one every thirty seconds) and will fire
at you. Destroying one awards **200 credits**. Press **Space** or click the
mouse to shoot back. Each planet and enemy

Planets belong to solar systems orbiting colorful stars. Planet sizes now vary widely with a standard deviation near 100 units, while stars are spaced roughly 500 units apart so systems cluster less tightly. Each system hosts one to nine planets on widely separated orbits so they never collide. Planet colors hint at what resources they hold. Their
If your ship is destroyed, a random sci-fi message appears for a few seconds and
then the introduction plays again so you respawn near the nearest star.

upper-right corner showing nearby planets. Clicking a planet on the radar
instantly warps your ship to its location.

Some planets host alien traders. Press **E** near a planet to land. A short animation moves the ship down to the surface when you are within ten percent of its radius. Landing on a vendor world automatically

exchanges Ore for credits at prices that vary per planet. Traders may also
offer randomized cargo delivery missions that pay credits on completion.

While landed, press **H** on planets with resources to gather Metal and Carbon.
Press **B** to place a base module if you have 10 Ore, 5 Metal and 5 Carbon.
Press **T** to deploy a defensive turret. Turrets automatically fire at nearby
enemies and never overheat. Press **R** to rotate the selected module before
building. Bases are saved locally so you can return to them later and appear as
brown squares on planets and on the radar. Turrets show up in red on the
minimap.


Planets belong to solar systems orbiting colorful stars. Planet sizes now vary widely with a standard deviation near 100 units, while stars are spaced roughly 500 units apart so systems cluster close together. Each system hosts one to nine planets on widely separated orbits so they never collide. Planet colors hint at what resources they hold. Their

gravity pulls on the player. Press **E** to land on planets to refuel and heal, but

touching a star will slowly damage your ship. Some worlds also replenish fuel,
oxygen and food, which slowly run out as you explore. Fuel capacity is now 1000
times larger for long journeys. The game code is

split into small ES modules inside the `modules` folder for clarity. Health and
resource bars from 0&ndash;100% are shown in the upper left, along with your
current X,Y coordinates. Key bindings and inventory counts appear at the bottom left.
On touch devices an on-screen joystick rotates the ship while smaller thruster buttons sit around a central **Fire** button. Land, Build and Harvest controls are lined up along the bottom so the layout feels natural on phones. Pinch zooming and page scrolling are disabled so the canvas stays fixed in place.

The map is infinite, so wander as far as you like. An
introductory animation shows your ship diving into a black hole before you spawn
near the closest solar system. The minimap now always displays an arrow pointing
toward the nearest star. Weapons heat up as you fire and will temporarily
lock if they reach 100%, so watch the heat meter and let them cool off before
blasting away again.
Simply open `index.html` in your browser to play the game locally. The canvas
fills the window for a full-screen experience. Modern
browsers load the ES modules correctly when the page is opened from disk. If
you prefer running a local server instead, any simple web server such as
`python3 -m http.server` will work just as well.

