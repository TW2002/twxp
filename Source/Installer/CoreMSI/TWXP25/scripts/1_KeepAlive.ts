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

# TWX Script Pack 1: Keepalive script
# Author           : Xide
# Description      : A VERY simple script which sends a "#" every 60
#                    seconds to keep the connection alive.
# Trigger Point    : Anywhere within TW where the global functions are
#                    working.
# Warnings         : Will send the "#" character every 60 sectors, wether
#                    the program is connected or not.  This character can
#                    sometimes disrupt things such as login and password
#                    prompts, etc.  I advise you only use it when your
#                    not at the console doing things.

:wait
send "#"
setDelayTrigger delay :wait 60000
pause
