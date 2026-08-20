import { useAuth } from "../../context/AuthContext.jsx";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import DashMenu from "../../components/DashMenu.jsx";
import EmptyStateArt from "../../components/EmptyStateArt.jsx";
import TopProfileTile from "../../components/TopProfileTile.jsx";
import SearchBox from "../../components/SearchBox.jsx";
import EntityList from "../../components/EntityList.jsx";

const DEFAULT_TAB_ID = "list";

const TABS = [
  {
    id: "category",
    tabLabel: "Categories",
    tabIcon: "fa-regular fa-list",
    icon: "fa-regular fa-list text-[var(--accent)]",
    singular: "Category",
    plural: "Categories",
    apiBase: "categories",
    nameField: "CategoryName",
    createKey: "category",
    linkTo: (name) => `/categories/${encodeURIComponent(name)}`,
    newButtonLabel: "New Category",
    modalTitle: "New Category",
    modalIcon: "fa-regular fa-list",
    modalSubtitle: "Give your category a name. Add it to thoughts from a thought's Details tab.",
    modalFieldLabel: "Category Name",
    modalPlaceholder: "e.g. Work",
    modalSubmitLabel: "Create Category",
    emptyMessage: "No categories yet — open a thought's Details tab and add one to create a category.",
  },
  {
    id: "tag",
    tabLabel: "Tags",
    tabIcon: "fa-regular fa-tag",
    icon: "fa-regular fa-tag text-[var(--accent)]",
    singular: "Tag",
    plural: "Tags",
    apiBase: "tags",
    nameField: "TagName",
    createKey: "tag",
    linkTo: (name) => `/tags/${encodeURIComponent(name)}`,
    newButtonLabel: "New Tag",
    modalTitle: "New Tag",
    modalIcon: "fa-regular fa-tag",
    modalSubtitle: "Give your tag a name. Add it to thoughts from a thought's Details tab.",
    modalFieldLabel: "Tag Name",
    modalPlaceholder: "e.g. Ideas",
    modalSubmitLabel: "Create Tag",
    emptyMessage: "No tags yet — open a thought's Details tab and add one to create a tag.",
  },
  {
    id: "list",
    tabLabel: "Lists",
    tabIcon: "fa-regular fa-list-tree",
    icon: "fa-regular fa-list-tree text-[var(--accent)]",
    singular: "List",
    plural: "Lists",
    apiBase: "lists",
    nameField: "ListName",
    createKey: "list",
    linkTo: (name) => `/thoughts/${encodeURIComponent(name)}`,
    newButtonLabel: "New List",
    modalTitle: "New Folder",
    modalIcon: "fa-regular fa-folder-plus",
    modalSubtitle: "Give your folder a name. You can sort thoughts into it afterward.",
    modalFieldLabel: "Folder Name",
    modalPlaceholder: "e.g. Work ideas",
    modalSubmitLabel: "Create Folder",
    emptyMessage: "No lists yet — open a thought's Details tab and sort it into a list to create one.",
  },
  {
    id: "folder",
    tabLabel: "Folders",
    tabIcon: "fa-regular fa-folder-tree",
    icon: "fa-regular fa-folder-tree text-[var(--accent)]",
    plural: "Folders",
    placeholder: true,
    description: "Nested folders for organizing your thoughts are coming soon.",
  },
];

function Organize() {
  const { user, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");

  const requestedTab = searchParams.get("tab");
  const activeTab = TABS.find((t) => t.id === requestedTab) || TABS.find((t) => t.id === DEFAULT_TAB_ID);

  const selectTab = (id) => {
    setSearchParams(id === DEFAULT_TAB_ID ? {} : { tab: id });
    setSearch("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div id="dashboard" className="w-full">
      <div id="dashWrap" className="flex w-full">
        <DashMenu />
        <div className="rightScreen w-full p-6 ml">
          <div id="homeHead" className="flex justify-between items-center">
            <div>
              <div className="dashBreadcrumb">Pages <i className="fa-regular fa-chevron-right text-[10px] mx-1"></i> <span>Organize</span></div>
              <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
                <i className="fa-regular fa-layer-group text-[var(--accent)]"></i> Organize
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <SearchBox value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${activeTab.plural.toLowerCase()}`} />
              <TopProfileTile />
            </div>
          </div>

          <div className="settingsTabBar mt-5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`settingsTab ${activeTab.id === tab.id ? "settingsTabActive" : ""}`}
                onClick={() => selectTab(tab.id)}
              >
                <i className={tab.tabIcon}></i>
                {tab.tabLabel}
              </button>
            ))}
          </div>

          {activeTab.placeholder ? (
            <section className="dashBody w-full mt-5">
              <h2 className="text-2xl flex items-center gap-2">
                <i className={activeTab.icon}></i> {activeTab.plural}
              </h2>
              <div className="emptyState">
                <EmptyStateArt size={110} className="emptyStateArt" />
                <p>{activeTab.description}</p>
                <span className="comingSoonBadge">Coming soon</span>
              </div>
            </section>
          ) : (
            <EntityList key={activeTab.id} {...activeTab} search={search} />
          )}
        </div>
      </div>
    </div>
  );
}

export default Organize;
