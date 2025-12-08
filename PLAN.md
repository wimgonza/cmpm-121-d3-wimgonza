# D3: {game title goes here}

## Game Design Vision

{a few-sentence description of the game mechanics}

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

Key technical challenge:
Key gameplay challenge:

### Steps D3.b

- [x] globe spanning grid that is able to move
- [x] memoryless cells
- [x] add movement buttons for cardinal directions
- [x] update playerCell logical position
- [x] update interaction radius
- [] victory condition for a token reaching a certain value
