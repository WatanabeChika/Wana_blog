import { sidebar } from "vuepress-theme-hope";

export default sidebar({
  "/": [
    "",
  ],
  "/posts/acg/": [
    {
      text: "动画相关",
      prefix: "/posts/acg/",
      collapsible: true,
      expanded: true,
      children: ["aria_aqua.md"],
    },
    {
      text: "漫画相关",
      prefix: "/posts/acg/",
      collapsible: true,
      expanded: true,
      children: [],
    },
    {
      text: "游戏相关",
      prefix: "/posts/acg/",
      collapsible: true,
      expanded: true,
      children: ["p5r_twins.md", "p5r_lavenza.md", "ff15_radio.md"],
    },
  ],

  "/posts/coding/": [
    {
      text: "可能实用的小玩意",
      prefix: "/posts/coding/",
      collapsible: true,
      expanded: true,
      children: ["audio_effect.md", "bpm_check.md", "mpv_lines.md", "cnki_search.md"],
    },
    {
      text: "小谜题",
      prefix: "/posts/coding/",
      collapsible: true,
      expanded: true,
      children: ["guess_puzzle.md"],
    },
    {
      text: "其他",
      prefix: "/posts/coding/",
      collapsible: true,
      expanded: true,
      children: ["movie_search.md", "ctf_easyrsa.md"],
    },
  ],

  "/posts/life/": "structure",
  // [
  //   "",
    // {
    //   text: "如何使用",
    //   icon: "laptop-code",
    //   prefix: "demo/",
    //   link: "demo/",
    //   children: "structure",
    // },
    // {
    //   text: "文章",
    //   icon: "book",
    //   prefix: "posts/",
    //   children: "structure",
    // },
    // "intro",
    // {
    //   text: "幻灯片",
    //   icon: "person-chalkboard",
    //   link: "https://plugin-md-enhance.vuejs.press/zh/guide/content/revealjs/demo.html",
    // },
  // ],
});
