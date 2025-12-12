# D3: GeoCrafter

## Game Design Vision

GeoCrafter is a location-based crafting game where players explore a map to collect
tokens from nearby locations. Tokens can be combined into higher-value crafted items.

## Technologies

- TypeScript for most game code, little to no explicit HTML, and all CSS collected in common `style.css` file
- Deno and Vite for building
- GitHub Actions + GitHub Pages for deployment automation

## Assignments

## D3.a: Core mechanics (token collection and crafting)

Key technical challenge: Can you assemble a map-based user interface using the Leaflet mapping framework?
Key gameplay challenge: Can players collect and craft tokens from nearby locations to finally make one of sufficiently high value?

### Steps D3.a

- [x] copy main.ts to reference.ts for future reference
- [x] delete everything in main.ts
- [x] put a basic leaflet map on the screen
- [x] draw the player's location on the map
- [x] draw a rectangle representing one cell on the map
- [x] use loops to draw a whole grid of cells on the map
- [x] use provided luck() function to assign token values based on grid cell coordinates
- [x] display token value directly inside each cell (red)
- [x] adds inventory that has shows nothing currently
- [x] player can pick up nearby tokens if they don't already have one
- [x] marker is removed when the token is picked up by the player
- [x] inventory updates in real time
- [x] player can combine equal tokens to create a new token of double the value
- [x] token label is updated after combining

## D3.b: Globe-spanning Gameplay

Key technical challenge: How can the game efficiently manage the dynamic generation and removal of cells in a globe-spanning world?
Key gameplay challenge: How can we create a gameplay loop where the player is incentivized to move in and out of visibility ranges of cells (to farm tokens) while maintaining a sense of progression and challenge, particularly with the crafting system and token values increasing over time?

### Steps D3.b

- [x] globe spanning grid that is able to move
- [x] memoryless cells
- [x] add movement buttons for cardinal directions
- [x] update playerCell logical position
- [x] update interaction radius
- [x] victory condition for a token reaching a certain value

## D3.c: Object persistence

Key technical challenge: How can you efficiently manage memory and data persistence for cells that are off-screen using the Flyweight pattern or a similar strategy, while ensuring that only modified cells are stored and restored when they reappear on the map?
Key gameplay challenge: How can you ensure that the map appears to have persistent memory of the player's modifications, even when parts of the map are no longer visible, without maintaining a continuous display of all cells?

### Steps D3.c

- [x] cell persistent memory state even when not visible
- [x] add persistent state to drawCell
- [x] make cell clicks persistent
- [x] update the visible cells function

## D3.d: Object persistence

Key technical challenge: How can we effectively abstract the player movement system using the Facade design pattern, ensuring that the game code remains decoupled from the specific movement control (geolocation vs. button-based), and persists the game state across page loads using the localStorage API, while also handling potential device orientation limitations or differences in browser geolocation APIs?
Key gameplay challenge: How can we create a seamless gameplay experience where the player can switch between movement modes (geolocation-based and button-based) without disrupting the flow of the game, and ensure that the player's progress and movement control preferences are maintained across game sessions?

### Steps D3.d

- [] add saving and loading
- [] on startup, load the game state
- [] automatically create a save state
- [] ...
