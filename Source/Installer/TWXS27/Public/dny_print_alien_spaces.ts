# ---------------------------------------------------------
# A simple script to spit out a list of known alien spaces
# for a game to a file. This file will be in your base 
# (root) TWXPROXY directory.
#
# All we do is loop thru every sector in the universe, check
# our database for the name of the constellation for each 
# sector and if it's a certain name, spit it to a file. This
# approach can be used for a lot of things, this is useful if
# you forget the sector numbers.
#
# December 1st, 2006 - By Singularity (Dnyarri)
# More scripts and info at http://www.navhaz.com
# ---------------------------------------------------------

# Set a variable named $file. GAMENAME is a constant that holds
# the assigned name of the game. The amp char means 'and' and 
# the rest is tacked on so you get something like 
# "mygame-alien_spaces.txt".
setVar $file GAMENAME & "-alien_spaces.txt"

# Erase the file to clear old versions.
delete $file

# Init the found variable
setVar $found_a_sector FALSE

# Initialize the loop at 11
setVar $idx 11

# While the loop index is less than the sector count of the uni
while ($idx <= SECTORS)

     # Get the sector from the DB. No choice here because the constellation
     # entry has no SECTOR value
     getSector $idx $sec

     # Here we're going to trim out some things that can throw us off
     setVar $constellation $sec.CONSTELLATION
     stripText $constellation " (unexplored)"
     stripText $constellation "uncharted space"
     stripText $constellation "."

     # With all of this, is it a particular alien "space" ? 
     getWordPos $constellation $pos "Space"
     if ($pos > 0)
          # It is!
          setVar $found_a_sector TRUE

          # Here we make a padding variable. Makes it easier to read
          # the file output by spacing things out better.
          getLength $idx $sector_size
          if ($sector_size = 1)
               setVar $pad "       "
          elseif ($sector_size = 2)
               setVar $pad "      "
          elseif ($sector_size = 3)
               setVar $pad "     "
          elseif ($sector_size = 4)
               setVar $pad "    "
          elseif ($sector_size = 5)
               setVar $pad "   "
          else
               setVar $pad "   "
          end

          # Write it all to the file defined above as $file.
          write $file $idx & $pad & $constellation
    
     # End of the earlier constellation "if" test.
     end
 
     # Add 1 to the index value so we can test the next sector.
     add $idx 1

# End of the while loop.
end

# ---------------------------------------------------------
# We're done!
if ($found_a_sector = TRUE)
     echo ANSI_14 & "**Data written to " & $file & ".**"
else
     write $file "No alien sectors found!"
     echo ANSI_14 & "**No alien sectors found!**"
end

# Give us back a prompt
send " *  "

# End the script
halt
# ---------------------------------------------------------
