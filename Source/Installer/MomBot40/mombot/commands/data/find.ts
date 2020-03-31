loadVar $bot~command
loadVar $MAP~stardock
gosub :BOT~loadVars
loadVar $PLAYER~unlimitedGame        
loadvar $SWITCHBOARD~bot_name 
loadvar $SWITCHBOARD~self_command 


setVar $BOT~help[1]  $BOT~tab&"find - Search TWX-DBase for Fighter/Port data"
setVar $BOT~help[2]  $BOT~tab&"  "
setVar $BOT~help[3]  $BOT~tab&"   find [f/nf/fp/p/de/ufde] [type] {sector} [port type]"
setVar $BOT~help[4]  $BOT~tab&"     - [type] : [de]ad-end or"
setVar $BOT~help[5]  $BOT~tab&"                [f]igged or  "
setVar $BOT~help[6]  $BOT~tab&"                [nf] no-fig or  "
setVar $BOT~help[7]  $BOT~tab&"                [fp] figged port or "
setVar $BOT~help[8]  $BOT~tab&"                [p]ort or  "
setVar $BOT~help[9]  $BOT~tab&"                [ufde] un-figged dead end"
setVar $BOT~help[10] $BOT~tab&"     - {sector}    sector number that you need finder data on,  "
setVar $BOT~help[11] $BOT~tab&"                   default is current sector"
setVar $BOT~help[12] $BOT~tab&"     - [port type] port type (s)ell , (b)uy, or (x) either"
gosub :bot~helpfile



gosub :search~find
halt

# includes:
include "source\module_includes\bot\loadvars\bot"
include "source\module_includes\bot\helpfile\bot"
include "source\module_includes\search"
