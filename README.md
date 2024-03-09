# Optipost
**Optipost** is a ROBLOX communications library written in roblox-ts that helps issue jobs to specific servers inside of a game, and vice versa.

```ts
/**
 *	@module Optipost
 *	@author methamphetqmine
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
\- Licensed under `GNU General Public License v3.0`. Modifications of this repository must be shared.