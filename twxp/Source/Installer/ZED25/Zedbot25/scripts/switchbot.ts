# Zed's Bot switcher
#
# Kills all running scripts, including system scripts.
# Loads the specified <bot> from config.txt
#
# Usage SwitchBot <Bot> <Name>
#
# If <bot> is omitted the next available bot will be loaded from config.txt

loadVar $parm1	
loadVar $parm2

SwitchBot $parm1 $parm1
