# @epdoc/exif Tasks

## Task #1 - Return values and asJSON method

In this module we have a problem and pain point in returning either an object or JSON object for each Exif.File. I am
suggesting something along the lines of the following:

For the different types in exif.schema.ts, which include file, image, video, audio, camera, application, and possibly
some top level properties, we need enumeration support and more.

If a client wants to object all of the properties Exif.File, they should be able to enumerate them and nest them. For
example the output might look like this (straight text) or be put in tables. and we want to be able to retrieve the
keys, capitalized keys and values and be able to format the output.

File info: path: value modifiedAt: value Camera info: Name: value

I would like to create a SSoT that can be used for setting a file:File. image:Image, etc and that likely contains:

1. a function or process of how to get the property. 1a. the function will take a FileSpec object (contains all stats,
   path, filename) and a metadata object (the object returned by the common exiftool command line tool) and will return
   the value. 1b. a simpler case will just take a named property from metadata 1c. an even simpler call will take
   focalLength and get metadata.FocalLength 1d. the function may or may not involve translation (eg "32 mm" -> 32) 1e.
   the property on file or image will not be set if the function or reference is also undefined
2. A way to enumerate thru the keys of the property in order to generate file or image from the definition that contains
   the keys and functions
3. We will need a const for the above, but also a return ts type
4. a toJSON function/process for returning the same value in a JSON object.

The client will either access properties directly off of Exif.File, or retrieve the data via one getter. metadata (from
exiftool) will also be a top level object in what we retrieve.

We could elect for Exif.File to have:

get fileInfo get cameraInfo get videoInfo get appInfo get metadata

And back support this with something like this export const ExifInfo { file camera video app, metadata }

But then the get file getter should be able to use our consts to figure out how to get the data. for example something
like this.

```ts
export const FileStuff {
  path: { value: (f,m)=>f.path},
  createdAt: { value: (f,m)=>f.info.createdAt, json: (f,m)=>f.info.createdAt.toISOString()}
}

get file(): Record<FileStuffType,unknown> {
  const result = {}
  for( const [key,def] of Object.entries(FileStuff)) {
    const value = def.value(this.#file,this.#metadata)
    if( _.isDefined(value) ) result[key] = value
  }
}
```

### Patterns

This is a pattern I use when creating general enums.

```ts
export const VersionLevel = {
  major: 'major',
  minor: 'minor',
  patch: 'patch',
  pre: 'pre',
  auto: 'auto',
} as const;
export type VersionLevelType = typeof VersionLevel[keyof typeof VersionLevel];
export const VersionLevelEnum: VersionLevelType[] = Object.values(VersionLevel);
export function isVersionLevel(value: unknown): value is VersionLevelType {
  return VersionLevels.includes(value as VersionLevelType);
}
```
