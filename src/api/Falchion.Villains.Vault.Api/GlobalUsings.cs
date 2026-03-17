// Disambiguate System.IO.Path from HotChocolate.Path, which is brought into scope
// by HotChocolate.AspNetCore alongside the SDK's implicit System.IO global using.
global using Path = System.IO.Path;
