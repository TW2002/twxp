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

# SUB:       Pack2Header
# Passed:    $Script - Name of the script being loaded
# Triggered: Anywhere (start of pack2 script)

:Pack2Header
  
  getLength $Script $spaces
  setVar $spaces (20 - ($spaces / 2)) - 1
  
  echo "**" ANSI_15 "/-------TWX-PROXY-SCRIPT-PACK-2-------\*"
  echo              "             Version 2.00**"
  
  while ($spaces > 0)
    echo " "
    subtract $spaces 1
  end
  
  echo $Script "***"
  echo ANSI_7 "For script information please refer to the*Pack2 Documentation.  Remember that you can*always use the help option (+) to get*information on any script feature."
  echo "**" ANSI_15 "Read the warnings about this script before*using it!**"
  return