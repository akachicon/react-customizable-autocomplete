## Long-term caching
To effectively cache files with webpack we need to understand what files do we cache, 
what cache for a file is based on, and what are the problems that cause cache busting.

In webpack (plugins aside) each file is produced based on a content of a chunk. A chunk
is usually a function (IIFE) which contains list of modules to execute. There also is a 
so called runtime chunk, which contains webpack specific bootstrap code (possibly with 
modules). During compilation each module and chunk is assigned an identifier. Modules and 
chunks designed in such a way that they include their actual ids. By default, these ids 
are numeric and depend on the order of the included modules. Assuming that the cache is 
based on the content of a file (contenthash - best caching option offered by webpack)
we can run in the following issues:

- If the runtime chunk contains some modules, and we add some other modules to the project
then the modules in the runtime chunk might be re-downloaded because of the content change
in the runtime chunk (new modules or module ids could be added to the runtime chunk).

- If a new module is added in between of the previous, all following modules will change
their corresponding ids and so the chunks containing these modules will change their content.

NOTE: there are different types of numeric ordering in webpack:
https://v4.webpack.js.org/configuration/optimization/#optimizationmoduleids

The solution is to make chunk and module ids deterministic. 

For webpack v4 this is done 
utilizing the *moduleIds: 'hashed'* optimization flag and special plugin to make chunk ids 
hashed as well. It is important to use suggested plugin with hashed module ids cause it 
generates chunk hash based on included (in that chunk) module hashes. Thus, whenever module 
content changes, its corresponding id changes, and the chunk id changes as well.

## webpack-dev-server
Under the hood webpack-dev-server uses webpack-dev-middleware. The key parts of the 
middleware are to call compiler.watch method and set output fs. By default, the output fs 
is in-memory. This means we can improve webpack-dev-server performance and memory consumption
by excluding static files (e.g. images) from compilation in combination with right 
overrides or contentBase option (possibly with watchContentBase option).
