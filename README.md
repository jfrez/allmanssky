# Procedural Space Explorer

This project is a small browser game written in pure JavaScript. It draws an
endless galaxy and generates textures for every planet, ship and the starry
background on the fly. Use the arrow keys or WASD to fire your thrusters.
Movement has inertia, so you'll drift through space unless you counter-thrust.

Enemy ships appear very rarely (roughly one every five minutes) and will fire
at you. Press **Space** or click the mouse to shoot back. Each planet and enemy
uses a unique procedurally created texture. A radar is always visible in the
upper-right corner showing nearby planets. Clicking a planet on the radar
instantly warps your ship to its location.

Planets belong to solar systems orbiting colorful stars. Planets are about 100
times the size of your ship, while stars are around 500 times larger. Their
gravity pulls on the player so you can land on planets to refuel and heal, but
touching a star will slowly damage your ship. Some worlds also replenish fuel,
oxygen and food, which slowly run out as you explore. Fuel capacity is now 1000
times larger for long journeys. The game code is

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

