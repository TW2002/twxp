# Copyright (C) 2005  Remco Mulder
# 
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with this program; if not, write to the Free Software
# Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
# 
# For source notes please refer to Notes.txt
# For license terms please refer to GPL.txt.
# 
# These files should be stored in the root of the compression you 
# received this source in.

# TWX Script Pack 1: TWGS Login Script
# Author           : Xide
# Description      : A login script for standard TWGS systems (tested for
#                    version 1.01.39).  Will enter in a user name, log into
#                    the game, passing all the messages, and deposit the user
#                    at the game command prompt.  To use, you will need to
#                    set the appropriate program variables:
#
#                    LOGINNAME - Your login name (to the TWGS system)
#                    PASSWORD - The password to your game account
#                    GAME - The letter of the game on the system
#
# Trigger Point    : On server connection.
# Warnings         : None.
# Other            : Useful to put this script in the 'Connection accepted'
#                    program event if you need to log in quickly.

# terminate script if disconnected
setEventTrigger 0 :End "Connection lost"

waitfor "(ENTER for none):"
send LoginName "*"
waitfor "Trade Wars 2002 Game Server"
send Game
waitfor "module now loading."
send "*t***" Password "*"
waitfor "Password?"
setTextLineTrigger 1 :End "Sector  : "
setTextTrigger 2 :Pause "[Pause]"
setTextTrigger 3 :Pause "Do you wish to clear some avoids?"
pause

:Pause
send "*"
killTrigger 2
setTextTrigger 2 :Pause "[Pause]"
pause

:End
