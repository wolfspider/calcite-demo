/* eslint-disable @typescript-eslint/no-unused-vars */
import { Attributes, Component, ComponentChild, ComponentChildren, h, Ref } from "preact";
import style from "./style.css";
import WebMap from "@arcgis/core/WebMap";
import MapView from "@arcgis/core/views/MapView";
import BookMarks from "@arcgis/core/widgets/Bookmarks";
import Basemap from "@arcgis/core/Basemap.js";
import BaseMapGallery from "@arcgis/core/widgets/BasemapGallery";
import LayerList from "@arcgis/core/widgets/LayerList";
import Legend from "@arcgis/core/widgets/Legend";
import Print from "@arcgis/core/widgets/Print";
import Features from "@arcgis/core/widgets/Features";
import Zoom from "@arcgis/core/widgets/Zoom";

class MapComponent extends Component {
  componentDidMount() {
    const webmapId =
      new URLSearchParams(window.location.search).get("webmap") ??
      "1742af40c5bf454d8cda029d70515a37";

    const map = new WebMap({
      portalItem: {
        id: webmapId,
      },
    });

    const view = new MapView({
      map,
      container: "viewDiv",
      padding: {
        left: 49,
      },
      popup: {
        dockEnabled: true,
        dockOptions: {
          position: "bottom-right",
          breakpoint: false,
        },
      },
    });

    const zoom = new Zoom({
      view,
    });

    zoom.visible = true;

    const basemaps = new BaseMapGallery({
      view,
      container: "basemaps-container",
    });

    const bookmarks = new BookMarks({
      view,
      container: "bookmarks-container",
    });

    const layerList = new LayerList({
      view,
      selectionEnabled: true,
      container: "layers-container",
    });

    const legend = new Legend({
      view,
      container: "legend-container",
    });

    const print = new Print({
      view,
      container: "print-container",
    });

    const featuresWidget = new Features({
      view,
      container: "features-widget",
    });

    view.on("click", (event) => {
      featuresWidget.open({
        location: event.mapPoint,
        fetchFeatures: true,
      });

      document.querySelector(`[data-panel-id=info]`)?.removeAttribute("hidden");
      document.querySelector(`[data-panel-id=info]`)?.removeAttribute("closed");
    });

    const filterElement = document.querySelector("calcite-filter");
    const paginationElement = document.querySelector("calcite-pagination");
    const initialNoticeElement = document.getElementById("initial-note");
    const noticeElement = document.getElementById("note");
    const cardContainer = document.querySelector(".card-container");

    /* Fetch the earthquakes feature service */
    fetch(
      "https://gis.alachuacounty.us/arcgis/rest/services/Operational/Applications/FeatureServer/0/query?where=App_status%20%3D%20%27Under%20Review%27&outFields=*&f=json",
    )
      .then((response) => response.json())
      .then(({ features }) =>
        features.map(({ attributes, geometry }) => ({
          ...attributes,
          geometry, // This will add geometry as a property inside attributes
        })),
      )
      .then((attributesWithGeometry) => initFilter(attributesWithGeometry));

    /* Filter the results to display */
    const initFilter = (items) => {
      filterElement.items = items;

      document.addEventListener("calciteFilterChange", () => {
        paginationElement.startItem = 1;
        paginationElement.totalItems = 0;

        // Prevent display if no Filter value is present
        noticeElement.removeAttribute("open");

        paginationElement.style.visibility = "hidden";

        cardContainer.innerHTML = "";

        // When a Filter value is present
        // Create Cards, update Pagination, and number of responses
        if (filterElement.value) {
          filterElement.filteredItems.forEach((item) => createCard(item));
          paginationElement.totalItems = filterElement.filteredItems.length;

          showNumberOfResponses(filterElement.filteredItems.length);

          // If additional pages are populated, display Pagination
          if (paginationElement.totalItems > paginationElement.pageSize) {
            paginationElement.style.visibility = "visible";
          }
        } else {
          // If no text is present in the Filter, display the initial notice
          initialNoticeElement.setAttribute("open", "");
        }
      });
    };

    /* Create Cards and their content */
    const createCard = (item) => {
      const headingName = item.App_No.replace(/[;']/g, "");
      // Populate Card content
      if (cardContainer.childElementCount < paginationElement.pageSize) {
        const cardString = `<calcite-card id="card-${item.OBJECTID}">
        <span slot="heading">
          <b>${item.Descrip}</b>
        </span>
        <span slot="description">
          Occurred on: ${new Date(item.AppDate)}
        </span>
        <calcite-button
          label="Open ${headingName} in map"
          icon-end="launch"
          slot="footer-end"
          target="_blank"
          width="full"
          id="goToButton-${item.OBJECTID}"
        >
          Open in map
        </calcite-button>
        </calcite-card>`;
        const cardElement = document.createRange().createContextualFragment(cardString);
        cardContainer.appendChild(cardElement);
        const goToButton = document.getElementById(`goToButton-${item.OBJECTID}`);
        if (goToButton) {
          goToButton.addEventListener("click", () => {
            view.goTo({
              target: item,
              zoom: 16, // Adjust the zoom level as needed
            });
          });
        }
      }
    };

    /* Display the number of responses in a Notice */
    function showNumberOfResponses(responseNumber: string | number) {
      const note = document.getElementById("note");
      const numberRecordsNote = document.getElementById("number-records");
      // If 0 responses, add "Sorry" to the Notice text
      // Add the Notice color and icon
      if (responseNumber === 0) {
        responseNumber = `Sorry, ${responseNumber}`;
        note.setAttribute("kind", "danger");
        note.setAttribute("icon", "exclamation-mark-triangle");
      } else {
        note.setAttribute("kind", "brand");
        note.setAttribute("icon", "information");
      }
      // Hide the initial notice
      initialNoticeElement.removeAttribute("open");
      // Notice text
      numberRecordsNote.innerHTML = `${responseNumber} records found.`;
      noticeElement.setAttribute("open", "");
    }

    /* Update Cards when interacting with Pagination */
    document.addEventListener("calcitePaginationChange", () => {
      cardContainer.innerHTML = "";

      //TODO: Needs to be updated for more elements!
      const displayItems = filterElement.filteredItems;

      displayItems.forEach((item) => createCard(item));
    });

    map.when(() => {
      const { title, description, thumbnailUrl, avgRating } = map.portalItem;
      const headerTitle = document.querySelector("#header-title");
      const itemDescription = document.querySelector("#item-description");
      const itemThumbnail = document.querySelector("#item-thumbnail") as HTMLImageElement;
      const itemRating = document.querySelector("#item-rating") as HTMLInputElement;

      if (headerTitle) headerTitle.textContent = title;
      if (itemDescription) itemDescription.innerHTML = description;
      if (itemThumbnail) itemThumbnail.src = thumbnailUrl;
      if (itemRating) itemRating.value = avgRating.toString();

      let activeWidget: string | null = null;

      const handleActionBarClick = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target.tagName !== "CALCITE-ACTION") {
          return;
        }

        if (activeWidget) {
          document
            .querySelector(`[data-action-id=${activeWidget}]`)
            ?.setAttribute("active", "false");
          document.querySelector(`[data-panel-id=${activeWidget}]`)?.setAttribute("hidden", "true");
        }

        const nextWidget = target.dataset.actionId;
        if (nextWidget !== activeWidget) {
          document.querySelector(`[data-action-id=${nextWidget}]`)?.setAttribute("active", "true");
          document.querySelector(`[data-panel-id=${nextWidget}]`)?.removeAttribute("hidden");
          activeWidget = nextWidget;
        } else {
          activeWidget = null;
        }
      };

      document.querySelector("calcite-action-bar")?.addEventListener("click", handleActionBarClick);

      let actionBarExpanded = false;

      document.addEventListener("calciteActionBarToggle", () => {
        actionBarExpanded = !actionBarExpanded;
        view.padding = {
          left: actionBarExpanded ? 150 : 49,
        };
      });

      document.querySelector("calcite-shell")?.removeAttribute("hidden");
      document.querySelector("calcite-loader")?.setAttribute("hidden", "true");

      const updateDarkMode = () => {
        // Calcite mode
        document.body.classList.toggle("calcite-mode-dark");
        // ArcGIS Maps SDK theme
        const dark = document.querySelector("#arcgis-maps-sdk-theme-dark") as HTMLLinkElement;
        const light = document.querySelector("#arcgis-maps-sdk-theme-light") as HTMLLinkElement;
        if (dark && light) {
          dark.disabled = !dark.disabled;
          light.disabled = !light.disabled;
        }
        // ArcGIS Maps SDK basemap
        map.basemap = Basemap.fromId("topo-vector");
      };

      document
        .querySelector("calcite-switch")
        ?.addEventListener("calciteSwitchChange", updateDarkMode);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  render(
    _props?: Readonly<Attributes & { children?: ComponentChildren; ref?: Ref<unknown> }>,
    _state?: Readonly<object>,
    _context?: unknown,
  ): ComponentChild {
    return (
      <div id="viewDiv" style={{ height: "100%", width: "100%" }}>
        {/* Additional JSX markup for your layout can go here */}
      </div>
    );
  }
}

const Home = () => {
  return (
    <div class={style.home}>
      <h1>Welcome to Calcite Components</h1>
      <p>We even have support for TypeScript!</p>
      <calcite-loader label="loading" />
      <calcite-shell content-behind hidden>
        <calcite-navigation slot="header">
          <calcite-navigation-logo id="header-title" heading-level="1" slot="logo" />
        </calcite-navigation>

        <calcite-shell-panel slot="panel-start" display-mode="float">
          <calcite-action-bar slot="action-bar">
            <calcite-action data-action-id="search" icon="search" text="Search" />
            <calcite-action data-action-id="layers" icon="layers" text="Layers" />
            <calcite-action data-action-id="basemaps" icon="basemap" text="Basemaps" />
            <calcite-action data-action-id="legend" icon="legend" text="Legend" />
            <calcite-action data-action-id="bookmarks" icon="bookmark" text="Bookmarks" />
            <calcite-action data-action-id="print" icon="print" text="Print" />
            <calcite-action data-action-id="information" icon="information" text="Information" />
          </calcite-action-bar>

          <calcite-panel heading="Search" height-scale="l" data-panel-id="search" hidden>
            <div id="search-container">
              <calcite-filter placeholder="Try searching" />

              <calcite-notice id="initial-note" open icon="information">
                <div slot="title">Try searching a place of interest</div>
                <div slot="message">Results will display when text is entered.</div>
              </calcite-notice>

              <calcite-notice id="note">
                <div id="number-records" slot="title" />
              </calcite-notice>

              <div class="card-container" />

              <calcite-pagination slot="footer" page-size="12" style="visibility:hidden" />
            </div>
          </calcite-panel>
          <calcite-panel heading="Layers" height-scale="l" data-panel-id="layers" hidden>
            <div id="layers-container" />
          </calcite-panel>
          <calcite-panel heading="Basemaps" height-scale="l" data-panel-id="basemaps" hidden>
            <div id="basemaps-container" />
          </calcite-panel>
          <calcite-panel heading="Legend" height-scale="l" data-panel-id="legend" hidden>
            <div id="legend-container" />
          </calcite-panel>
          <calcite-panel heading="Bookmarks" height-scale="l" data-panel-id="bookmarks" hidden>
            <div id="bookmarks-container" />
          </calcite-panel>
          <calcite-panel heading="Print" height-scale="l" data-panel-id="print" hidden>
            <div id="print-container" />
          </calcite-panel>
          <calcite-panel heading="Info" height-scale="l" data-panel-id="info" hidden closable>
            <div id="features-widget" />
          </calcite-panel>
          <calcite-panel heading="Details" data-panel-id="information" hidden>
            <div id="info-content">
              <img id="item-thumbnail" alt="webmap thumbnail" />
              <div id="item-description" />
              <calcite-label layout="inline">
                <b>Rating:</b>
                <calcite-rating id="item-rating" read-only />
              </calcite-label>
            </div>
          </calcite-panel>
        </calcite-shell-panel>
        <MapComponent />
      </calcite-shell>
    </div>
  );
};

export default Home;
