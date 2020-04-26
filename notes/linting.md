## prettier and eslint
As the proposal suggests, this project uses prettier for code formatting and strips
this functionality from eslint. Still, eslint is the one helping to prevent bugs by
analyzing syntax constructions and making (or hinting) it to be more convenient for 
the human eye. This leads to the conclusion that in case of conflicts eslint should 
take preference, which is the reason why prettier executes first.

It is also worth to mention that the author would prefer using prettier in the form 
of eslint plugin (namely eslint-plugin-prettier), but the behavior cannot be achieved 
due to some [bugs](https://github.com/prettier/eslint-config-prettier#arrow-body-style-and-prefer-arrow-callback) 
in desired cases (using eslint --fix with eslint-plugin-prettier and arrow-body-style rule).
