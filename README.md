# Procedural Space Explorer

This project is a small browser game written in pure JavaScript. It now uses WebGL to render a simple **3D** galaxy using the `three.js` library loaded from a CDN. Fly with **W/A/S/D** to move, **R/F** to ascend or descend and use the arrow keys to rotate. A procedurally generated starfield surrounds you so the universe feels endless.
Enemy ships occasionally spawn and chase you through space. Press **Space** to fire lasers from your ship. Each planet and enemy
uses a unique procedurally created texture. A small radar overlay appears in the
upper-right corner showing nearby planets from a top-down view. Clicking a dot
on the radar instantly warps your ship above that world.

Some planets host alien traders. Landing on a vendor world automatically
exchanges Ore for credits at prices that vary per planet. Traders may also
offer randomized cargo delivery missions that pay credits on completion.

While landed, press **B** to place a base module if you have at least 10 Ore.
Bases are saved locally so you can return to them later and appear as brown
squares on planets and on the radar.


Planets belong to solar systems orbiting colorful stars. These systems are generated procedurally in three dimensions so you can travel forever without hitting an edge. Planets are about 100
times the size of your ship, while stars are around 500 times larger. Their
gravity pulls on the player so you can land on planets to refuel and heal, but
touching a star will slowly damage your ship. Some worlds also replenish fuel,
oxygen and food, which slowly run out as you explore. Fuel capacity is now 1000
times larger for long journeys. A status HUD shows health, fuel, oxygen, food
levels and your current credits and ore. The game code is

split into small ES modules inside the `modules` folder for clarity. Health and
resource bars from 0&ndash;100% are shown in the upper left, along with your
current X,Y coordinates. The map is infinite, so wander as far as you like. An
introductory animation shows your ship diving into a black hole before you spawn
at a random set of coordinates. Weapons heat up as you fire and will temporarily
lock if they reach 100%, so watch the heat meter and let them cool off before
blasting away again.
Simply open `index.html` in your browser to play the game locally. The canvas
fills the window for a full-screen experience. Modern
browsers load the ES modules correctly when the page is opened from disk. If
you prefer running a local server instead, any simple web server such as
`python3 -m http.server` will work just as well.

