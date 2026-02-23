# 2d game
Basically a top-down RPG-like game. Currently unfinished.

With this project I refine my skills using canvas, complex algorithms, data trees, rendering.

## Notable stuff
- Fast RTree implementation
- Complex rendering system
- Advanced collision system for any figure, using SAT (Separation Axis Theorem) + RTree
- It's an actual game :)

## Code & style
Game updates every tick. Everything that needs to render something or do something on tick must implement or extend Tickable.
Everything that uses Tickables must implement or extend Ticker (Tickable itself).

### Linters
1. Prettier - basic code style
2. ESLint - code analyze and style (prettier integrated)
3. Stylelint - stylsheet analyze and style

### Imports
Please use global imports and follow the order:
1. Package imports
2. Global imports
3. Relative imports
4. Style and other imports
5. SolidJS attributes (needed for bundler)
