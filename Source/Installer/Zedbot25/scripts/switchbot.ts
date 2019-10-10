# Zed's Bot switcher
#
# Kills all running scripts, including system scripts.
# Loads the specified <bot> from config.txt
#
# Usage SwitchBot <Bot>
#
# If <bot> is omitted the next available bot will be loaded from config.txt

loadVar $parm1	

SwitchBot $parm1
