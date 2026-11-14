# Template disposition
Current scope: five-weapon enclosed tactical training range. Four target distances, hit feedback and solid perimeter; enemies deferred.
Keep native Engine/frontend roots, Rapier controller, first-person camera and bounded touch movement protocol.
Extend ground and add native Pack range geometry and static perimeter colliders. Remove showcase objects and their colliders together; hide all self render geometry while retaining rig bindings.
Replace vase editor and scene child with weapon sandbox Plugin. Models are authored as mesh/material Pack assets and camera-relative scene children; no parallel renderer or Canvas.
Weapon proof: ammo/reload unit tests and real-input screenshots for each model, fire, switch, reload and AWM scope; desktop and mobile layouts.
