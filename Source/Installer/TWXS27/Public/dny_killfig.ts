# -------------------------------------------------------------------
# Dnyarri fig killer by Aaron Colman, aaron@ibasics.biz.
#
# This script is released under the GPL on June 22th, 2005
# Go here for the license: http://www.gnu.org/copyleft/gpl.html
#
# Basically it means 3 things.
# 1. You can edit and use the script as you wish provded that:
# 2. You release the source code for any changes and
# 3. Give credit to the original author(s) in any such work.
#
# Kept getting killed with my lawnmower script, the enemy corp's
# photon script was just too fast. This was my solution. It sends
# all of the commands in a burst, with lots of spaces to abort any
# displays. Tell it the sector num and the fig amount and it'll
# blast, retreat and run a density scan of the area. I assigned it
# to my F12 key so it's easy to call up whenever I need it. Do the
# same and you'll stand a better chance of surviving the enemy grid.
# -------------------------------------------------------------------

getinput $hit_sector "Hit which sector? "
getinput $hit_amount "Attack with how many (default = 10)? "

# Bounds check the hit sector
isNumber $result $hit_sector
if ($hit_sector = "") 
      setVar $hit_sector 0
end
if ($result = 0)
      setVar $hit_sector 0
else
      if ($hit_sector < 1)
           setVar $hit_sector 0
      end
end

# Bounds check the hit amount
isNumber $result $hit_amount
if ($hit_amount = "") 
      setVar $hit_amount 10
end
if ($result = 0)
      setVar $hit_amount 10
else
      if ($hit_amount < 1)
           setVar $hit_amount 10
      end
end

if ($hit_sector = 0)
      halt
end

send "M" $hit_sector "* A" $hit_amount "* < SD"

# done

