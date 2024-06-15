import { LayoutGrid, Settings } from "lucide-react";

type Submenu = {
  href: string;
  label: string;
  active: boolean;
};

type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/dashboard",
          label: "Dashboard",
          active: pathname.includes("/dashboard"),
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    // admin
    {
      groupLabel: "Requested branches",
      menus: [
        {
          href: "/dashboard/requestedBranch",
          label: "Requested branches",
          active: pathname.includes("/dashboard/requestedBranch"),
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    // manager
    {
      groupLabel: "Branches management",
      menus: [
        {
          href: "/dashboard/branches",
          label: "Branches",
          active: pathname.includes("/dashboard/branches"),
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },

    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/dashboard/account",
          label: "Account",
          active: pathname.includes("dashboard/account"),
          icon: Settings,
          submenus: [],
        },
      ],
    },
  ];
}
