TWX Proxy Quick Program Reference

This document is a temporary file which I long term plan to
replace with a proper help document, it outlines some of the
basic features of TWX Proxy and how to get the program up
and running.

For a more up to date reference, please refer to the TWX Proxy
website at http://www.twxproxy.com


GETTING STARTED

Ok, so you've downloaded this great program everyones been
talking about but your totally lost on how to use it?  Don't
be embarrassed - TWX Proxy doesn't function as usual helpers
would.  Infact if you didn't refer to this file or had someone
to help you I could almost guarantee you'd be very frustrated
and confused.

Step 1:  Install TWX Proxy.  If your reading this you've obviously
done that, so we can skip this step.

Step 2:  Load up your favourite terminal or telnet program.  You
will need this program to be able to view the text which is processed
in the program.  I usually use TeraTerm, which is fast enough and 
suits my needs.  Just about any telnet compatible program should 
work with TWX Proxy, although if you experience any problems you 
should try using a different one.  Although I can't give any first 
hand information, I have friends who have tried TWAR with it and 
found it to work as usual.

Step 3:  Load up TWX Proxy.  If you've never done this before, you'll
get a message dialog advising you to refer to this file.  You'll also
get another dialog informing you that you won't be able to connect
to any game servers before you create a database.

Step 4:  Create a database.  Before you can use TWX Proxy, you'll need
to make yourself a defined game and sector database.  If you havn't
loaded the program before (see above) you should already have a dialog
infront of you with the 'Add' button selected.  If you don't have this
dialog, you can access it by right clicking the TWX icon in the corner
of your screen and selecting 'Setup'.  

Now we need to make the database.  Click the 'Add' button and fill out
the values for your game, then click 'OK' when finished.  You should
now have a new database selected and ready for use.  Don't worry about 
any of the login script info just yet, that will become more clear 
later when you are familiar with how the program handles its scripts.  
Click 'OK' down the bottom of the setup dialog to exit it.

Step 5:  Connect to TWX Proxy.  For those of you who aren't familiar
with the term, Proxy means a 'relay' program which acts as a go-between
between a client and server (in this case, a telnet program and our
game server).  This means before we can work with TWX Proxy properly,
we have to connect to it first using our telnet program.  I can't give
you any detailed instructions here as I'm not sure which program
you've chosen to use or how to work it.  The best approach to take is
to pretend there is a game server at the address 127.0.0.1 on port 23.
Using your telnet program connect to this 'fake' server.  You should
see a whole lot of text explaining the TWX Proxy version and a few
other details.

Step 6:  Connect to a server.  Now we've got our telnet program loaded
and connected to TWX Proxy, we've got our database all built up and
ready to go.  We now connect to a game server.  One way of doing this
is by right clicking the TWX icon and clicking 'Connect'.  If you've
done everything right, you should now be able to play trade wars
through your telnet program as normal, only now you've got access to
a cool new bunch of features which TWX Proxy offers.

Step 7:  I would put a cheesy 'congratulations! your now connected with
TWX Proxy' down here, but I don't work for Microsoft and would rather
keep some certain amount of self-respect :)


FEATURES

Here is an outline of alot of the features in TWX Proxy.  I'm sure you'll
learn many more tricks as you become more familiar with the program.
Remember that every menu has a help option (+) that you can use to get
more detailed information on things.  Use this well and you'll be conquering
the universe in no time at all.

The Terminal Menu:  

The terminal menu is one of the most useful and
most powerful functions of TWX Proxy.  To access it, press '$' in your
telnet program (this key can be changed in the setup dialog).  You
should see a 'Main>' prompt.  Press '?' at this prompt for a list
of menus you can go into.

Data menu:  This menu is where you perform queries on all the data
TWX Proxy has captured.  As of v2.04, TWX Proxy captures data from:

1.  Sector displays (when you display a sector your in)
2.  Holo scans
3.  Midwarp
4.  Density scans
5.  Computer warp lane calculation
6.  CIM warp lane calculation
7.  Ether probe sector display
8.  CIM warp display
9.  CIM port display
10. Fig Refresh
11. Port Reports (CR) and when porting
12. V-Screen (Stardock location if unknown)

There is also an advanced bubble finder here.  It can be used to display
a summary of the bubbles picked up during ZTM (or exploration).

Script menu:  This menu allows you to manage your scripts.  While you
can do anything in this menu by right clicking the TWX icon anyway,
it is still very useful to have as it speeds up working considerably.
If you have a script going berserk, its always much easier to punch
the keys $-S-X or $-Z rather than having to click through a bunch of menus.

Port menu:  This menu is just like the data menu, only it has options
specific to getting information on the ports TWX Proxy has picked up from
your port CIM download.

Setup menu:  All the items in this menu are just an in-terminal reflection
of what you get when you right click the TWX icon, then 'setup'.

Burst feature:  Definitely MY MOST USED FEATURE.  The burst feature
lets you send a number of keys all at once (in one network packet).
This lets you move as fast as the game can possibly allow.  To make
use of this feature, press 'B' from the 'Main>' prompt, then type
in a bunch of stuff and hit enter.  The enter key is depicted as
the hash '*' character.  So, to bust a planet off from the stardock,
you could type 'quy.*clzdyps'.  You can easily resend the last burst
sent by pressing 'R' from the 'Main>' prompt.

Quick loading scripts:  Pressing a number (1-9) from the 'Main>' prompt
will execute a script with the corrisponding name (i.e. 1 would trigger
1.ts to activate).


Scripts:

Easily one of the most useful (and most talked about) features of
TWX proxy is its scripting power.  TWX Proxy permits multiple scripts
to be run at the same time, script event binding, even time trigger
scripts.  Scripts are basic text files which contain a sequence
of conditions and commands which are interpreted by the program.
You can easily edit any TWX script (except encrypted ones) in any
text editor.  This means you can easily write your own.

I won't go too far into how the scripting language works in this
document as I would only be repeating myself.  For a proper reference,
right click on TWX, go to Help, then click on 'Scripting Reference'.


Message History:

The message history keeps a record of almost all messages you 
recieve in the game.  These messages are stored in a viewable way.  
To see them, right click the TWX icon, select 'View', then 'History'.


Logging:

If you have logging enabled, TWX Proxy will automatically save all
incoming data to file.  These files will be stored in the Logs
folder and named according to the time/date the file was created.
I use this feature to record EVERYTHING for later reference, purging
old logs manually after they've been around for more than a couple
of weeks.  This feature has saved me many times.



TWX Proxy has many features, some are more obvious than others.  If
you want to take full advantage of its power, its really a good idea
to learn the scripting language.  The best way to do this is to have
a good look over the open source pack1 scripts - you can open these
in notepad and modify them whenever you like.  You also get access
to a selection of very powerful and configurable routines that can be
called from scripts (the pack2 routines).  For an example of what can
be done with these routines, refer to the Script pack2 Reference.