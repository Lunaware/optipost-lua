# Optipost
**Optipost** is a WEB > ROBLOX communications library that helps issue jobs to specific servers inside of a game, and vice versa.

```ts
/**
 *	@module Optipost
 *	@author methamphetqmine
 *	@description A lua package for managing jobs between a web server and your ROBLOX game.
 */
```

## Usage
```lua
local Optipost = require(<PATH>)
local Session = Optipost.new("https://web.server", "authentication")
Session:Connect()

Session.OnJobRecieved:Connect(function(Job: {Identifier: string, Data: any})

end)
```

## License
- Licensed under `GNU General Public License v3.0`. Modifications of this repository must be shared.