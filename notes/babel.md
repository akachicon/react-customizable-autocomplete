## Purpose

Generally we can write two types of babel config - for apps and libs.
The distinction mainly is due to use of different types of polyfills, cause we cannot use global polyfills for a lib,
and it's not worth it to use modularized polyfills for an app. 
**Current config is supposed to be used for an app and cannot be used for a lib** without modification.

## plugin-transform-runtime

According to the docs the plugin generally does the following:

- Automatically requires regenerator for helpers and app code when you use generators/async functions 
(toggleable with the *regenerator* option).

- Can require core-js for helpers and app code to create sandbox environment if necessary instead of assuming the 
required api will be polyfilled by the user (toggleable with the *corejs* option).

- Automatically removes the inline Babel helpers and uses the module helpers instead 
(toggleable with the *helpers* option).

- Accepts @babel/runtime version (or similar runtime-corejs version) to be able to perform as advanced transpiling 
as possible for the specified version.

Let's briefly describe each option's behaviour, pros, and cons.

#### regenerator

- It does not respect browsers-list, so this option affects your code (adding regenerator modules to the bundle) 
whenever *regenerator* flag is on and async syntax (or new api) is met (**either in app code or helpers**).

- It takes precedence (in terms of execution order) over preset-env, so even if you polyfill promise globally or 
preset-env opts out from polyfilling async syntax (or new api) the transformation will happen.

- It requires the regenerator lib in code, so it does not pollute global scope.

From the first point it's obvious that using *regenerator* option is very much likely to be overhead for the app code 
size, cause there is great probability that the app use some async syntax (or new api) and, in case where it's 
something simple, like promise, or target requirements are not very harsh, there is great possibility that it is 
already supported by targeted browsers.

From the second point we can conclude that using this option with global polyfill makes no sense unless we have 
some third party modules which uses regenerator functionality and are not processed with babel. In this case, we should 
either polyfill globally (which means there is no sense in using *regenerator* option) or specify these modules for 
processing (which can be a hard task with unstable outcome).  

The third point is good by itself but is too small advantage for the first and second drawbacks.

#### corejs

- It does not respect browsers-list, so this option affects your code (adding core-js modules to the bundle) 
whenever *corejs* flag is on and new api (es6+ but not the regenerator api) is met (**either in app code or helpers**).

- It takes precedence (in terms of execution order) over preset-env, so even if you polyfill api globally or 
preset-env opts out from polyfilling this api the transformation will happen.

- It requires core-js lib parts in code, so it does not pollute global scope.

Considering the fact that in any app nowadays there are a lot of es6+ apis use of this option will significantly
increase your bundle size. Many of these apis are currently supported and such an overhead is not reasonable, so
the preferable option is turn off *corejs* and use global polyfills.

The second and third points are the same as for *regenerator* option and conclusions are the same.

#### helpers

Helpers will be substituted with corresponding module calls instead of being placed in inline fashion. No reasons to
not to use this option.

#### version

By default babel assumes version 7.0.0 for the runtime which is quite old, so this option should be specified so the 
plugin can perform advanced transformation.

## preset-env

The main feature of this preset lies behind *useBuiltIns* option. Depending on its value polyfills and syntax
transformations can be applied based on either target browsers ('entry') or used features ('usage'). It seems 
tempting to use the latter, so let's consider its downsides.  

Since helpers can use some of the new features not supported by targeted environments of choice, we should have a way 
to make these features available (assuming that we are deduping them with *helpers* option of transform-runtime).

The first option is to make those polyfills required utilizing the 'corejs' option for transform-runtime plugin. 
But as discussed above it is not a good idea and it's even worse than using 'entry'.    

The second option is to process helper files with babel using preset-env. We can do that but will be forced to work
with module structure which is not considered public.
https://github.com/babel/babel/issues/9853#issuecomment-501365267

Moreover, we should process every file in node_modules which requires a polyfill, which can be a task far from 
pleasant regarding to certain environments.

Also pay attention to these notes: 
https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#better-optimization-of-polyfill-loading

Because of the above this config uses *useBuiltIns: 'entry'*.

## core-js

#### version

It is recommended to specify minor core-js version, like *corejs: '3.6'*, instead of *corejs: 3*, since the latter will 
not inject modules which were added in minor core-js releases.
https://github.com/zloirock/core-js/blob/master/docs/2019-03-19-core-js-3-babel-and-a-look-into-the-future.md#babelpreset-env

#### fetch

The author of core-js library has not included fetch in the library, so it is not polyfillable with preset-env.
https://github.com/zloirock/core-js#missing-polyfills
