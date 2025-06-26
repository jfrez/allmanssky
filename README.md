# Procedural Space Explorer

This project is a small browser game written in pure JavaScript. It draws an
endless galaxy and generates textures for every planet, ship and the starry
background on the fly. Use the arrow keys or WASD to fire your thrusters.
Thruster flames animate while keys are held down so you can tell which jets are
firing. Movement has inertia, so you'll drift through space unless you
counter-thrust.
Enemy ships appear very rarely (roughly one every five minutes) and will fire
at you. Press **Space** or click the mouse to shoot back. Each planet and enemy
uses a unique procedurally created texture. A radar is always visible in the
upper-right corner showing nearby planets. Clicking a planet on the radar
instantly warps your ship to its location.

Some planets host alien traders. Press **E** near a planet to land. A short animation moves the ship down to the surface when you are within ten percent of its radius. Landing on a vendor world automatically
exchanges Ore for credits at prices that vary per planet. Traders may also
offer randomized cargo delivery missions that pay credits on completion.

While landed, press **H** on planets with resources to gather Metal and Carbon.
Press **B** to place a base module if you have 10 Ore, 5 Metal and 5 Carbon.
Press **R** to rotate the module before building. Bases are saved locally so
you can return to them later and appear as brown squares on planets and on the
radar.


Planets belong to solar systems orbiting colorful stars. Planet sizes now vary widely with a standard deviation near 100 units, while stars are spaced around 12,000 units apart so traveling between them takes under ten seconds. Each system hosts one to nine planets on distinct orbits. Planet colors hint at what resources they hold. Their
gravity pulls on the player. Press **E** to land on planets to refuel and heal, but
touching a star will slowly damage your ship. Some worlds also replenish fuel,
oxygen and food, which slowly run out as you explore. Fuel capacity is now 1000
times larger for long journeys. The game code is

split into small ES modules inside the `modules` folder for clarity. Health and
resource bars from 0&ndash;100% are shown in the upper left, along with your
current X,Y coordinates. Key bindings and inventory counts appear at the bottom left.
On touch devices an on-screen joystick rotates the ship while buttons for each thruster, landing, building, harvesting and firing let you play on mobile as well as desktop.
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

