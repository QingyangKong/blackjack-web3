# Step 1
Steps described following are the way to develop the game. The branch is the step 1. Follow steps to create the a web3 game if you are a developer. 

1. Initialize the project<br>
Run command`pnpm create wagmi` to create a wagmi project.

2. install dependecies
```shell
cd blackjack
pnpm install 
```

3. run the project
```shell
pnpm run dev
```

4. check the file architecture<br>
All source files are saved in `/src`. Providers(wallets) are configured in the `src/wagmi`. 

5. install tailwindcss<br>
```shell
pnpm add tailwindcss @tailwindcss/postcss postcss
```

6. add tailwindcss to the project<br>
- Create a file called `postcss.config.mjs` under the root directoty and add tailwindcss as a plugin. 
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  }
}
```
- Import tailwindcss in the `src/app/global.css`. Remove all codes in global.css and add the line `@import "tailwindcss";`

Check more details on [install tailwindcss using postCSS](https://tailwindcss.com/docs/installation/using-postcss)

7. start developing the fornt-end<br>
Remove everything in `src/app/page.tsx`.

8. develop the front-end to make it like file in this branch.<br>
Then you can see the UI below:
![alt text](/imagesForReadme/ui-1.png)
