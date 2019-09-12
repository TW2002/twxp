               ---------------------------------------------
                Dnyarri macro pack by Dnyarri / Singularity
                                  Version 2
                               August 7th 2005
                              aaron@ibasics.biz
               ---------------------------------------------


Ever had one of THOSE days? Where everyone seems a split second
ahead of you on EVERYTHING? I had one of those days playing
Tradewars recently. Trust me, it was not fun.

I made these scripts to solve that problem. Actually, I only made
2 of them to solve the problem... the macro runner was just a quick
hack of the looper. The macro manager came about later.

The file save/load stuff...
They use the same file format. It's a text file, so you can just
pop them open in notepad if you want to see them. You can save
the files under whatever name you want, allowing you to build a
small (or large) library of macro files instead of just one
saved macro.

The variables...
%0 thru %9 are user-defined variables. Take for instance this:
M%0* A1000* F1*CT <

Moves to sector %0, attacks with 1000, lays 1 toll fighter for
the corp and retreats back. You'd need something like this in
a busy game where others are using ptorp or pdrop scripts and
you want to hit-retreat a ftr.

It's a pain in the butt to have to edit your macro every time, 
so now you don't have to. Simply use the variable, set the 
variable description to something that helps you remember, save
the file and send a copy to everyone in your corp. I use my 
helper's macro blast to load the script, but I could also use 
the trigger script to do something similar on every fighter I 
run into if I wanted something running in the background.

Each variable can have a description, save-able to the file,
so non-macro inclined people can still do stuff. When you run
the macro it'll ask you for the stuff to put into the variable
and then compile it for execution. Handles ~, ^M and * style
carriage returns.


Trigger script:
Set the trigger, it runs. Triggers are case sensitive so be
careful. Set a description to remind you what the macro does.

The timeout feature lets the trigger expire after a certain
amount of time. This is to keep overly broad triggers from
hitting in places they shouldn't or to keep you from forgetting
about them at the wrong time. Set the timeout to 0 and you'll
disable the timeout.

The run-once feature runs, then the script terminates. The
persistent run keeps running as long as the script hasn't timed
out. If you disable timeout you need to be extra careful about
the effects... especially on other scripts.

My favorite use of this is a photon-invasion scenario. You trigger
on the photon launch for corpies to macro in, attack,  land, fire a
ftr wave, claim the planet, evict others, pwarp off and put figs for
defense. All in a single burst, all in under a second, without
having to debug your macro or worry about typos.

In the new version you can also put variables in your trigger text,
so that you can create an easy attack script. You can also call
twx scripts just by putting the script's path and filename in the
macro field.


Looper script:
Got the idea from Vid's great looper script. Added the variables
and save stuff to make things a little easier. Fastest twarp colo and
pbuster you can possibly get is a macro, so that's good. Of course
it's also easier to blindwarp someplace and fuse, too. So be
careful. Probably the best way is to use your helper or term's
macro "record macro" feature, run the loop once, then copy-paste
the macro into the looper and save the file for future use.

As they say on TV... I am not responsible for any mistakes you
make with this. Again, like the trigger script, you can load 
scripts this way too.


Macro runner / blaster:
Not much point for this, really. Helper macros are easier to use.
But considering that it was little more than a hack-and-paste job
to the looper... I figured I might as make it just in case.


Macro manager:
You can never have enough macros to go around. This script acts as
a macro control panel. It has a general file and a game-specific
file so you can make a general macro file, then use the game-specific
file to tweak based on changes in the sector numbers and stuff. 

The manager can be assigned to a key by editing the line:
setVar $bind_to_key "-"

And changing - to whatever other key you want. Obviously, by default,
it binds to -. Set it to just "" and it bind to any key at all. This
is helpful if you want to assign it to a key/button in swath, zoc or 
attac. You can load a different config file by changing:
setVar $load_other_file ""

You can load .mac files. You can call scripts directly. You can load
things in the trigger or looper script so you have a looper or trigger
macro to call on demand. You can just type in a macro and run it.
Again, you can use %0 thru %9 for variables.

example_conf.ini is included, put it in your root twx directory and
load it to get an idea of how things work. Just load the mac man and
hit the assigned macro key. The rest is fairly self-explainatory.


Anyway, that's all folks. I've got rid of the compiled versions and
just put the .ts files so I don't have to worry about compiling them
for every version of twx that comes out.

Any questions, comments, bugs... let me know.
