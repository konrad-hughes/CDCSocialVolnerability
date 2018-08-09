/*
 | Copyright 2016 Esri
 |
 | Licensed under the Apache License, Version 2.0 (the "License");
 | you may not use this file except in compliance with the License.
 | You may obtain a copy of the License at
 |
 |    http://www.apache.org/licenses/LICENSE-2.0
 |
 | Unless required by applicable law or agreed to in writing, software
 | distributed under the License is distributed on an "AS IS" BASIS,
 | WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 | See the License for the specific language governing permissions and
 | limitations under the License.
 */
define([
  "calcite",
  "boilerplate/ItemHelper",
  "boilerplate/UrlParamHelper",
  "dojo/i18n!./nls/resources",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojo/_base/array",
  "dojo/_base/Color",
  "dojo/colors",
  "dojo/number",
  "dojo/query",
  "dojo/on",
  "dojo/dom",
  "dojo/dom-attr",
  "dojo/dom-class",
  "dojo/dom-geometry",
  "dojo/dom-construct",
  "dojox/charting/Chart",
  "dojox/charting/themes/Bahamation",
  "dojox/charting/axis2d/Default",
  "dojox/charting/plot2d/Pie",
  "dojox/charting/plot2d/Columns",
  "dojox/charting/action2d/Tooltip",
  "dojox/charting/action2d/Highlight",
  "esri/identity/IdentityManager",
  "esri/core/watchUtils",
  "esri/core/promiseUtils",
  "esri/portal/Portal",
  "esri/layers/Layer",
  "esri/layers/GroupLayer",
  "esri/layers/FeatureLayer",
  "esri/renderers/SimpleRenderer",
  "esri/renderers/UniqueValueRenderer",
  "esri/symbols/PictureMarkerSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/geometry/geometryEngine",
  "esri/Graphic",
  "esri/widgets/Home",
  "esri/widgets/Search",
  "esri/widgets/Legend",
  "esri/widgets/Print",
  "esri/widgets/ScaleBar",
  "esri/widgets/Compass",
  "esri/widgets/BasemapGallery",
  "esri/widgets/Expand",
  "dojo/text!./Top10Symbols.json"
], function (calcite, ItemHelper, UrlParamHelper, i18n, declare, lang, array, Color, colors, number, query, on,
             dom, domAttr, domClass, domGeom, domConstruct,
             Chart, ChartTheme, DefaultAxis, PiePlot, ColumnsPlot, ChartTooltip, ChartHighlight,
             IdentityManager, watchUtils, promiseUtils, Portal, Layer, GroupLayer, FeatureLayer,
             SimpleRenderer, UniqueValueRenderer, PictureMarkerSymbol, SimpleFillSymbol, geometryEngine, Graphic,
             Home, Search, Legend, Print, ScaleBar, Compass, BasemapGallery, Expand,
             Top10SymbolsText) {

  return declare(null, {

    config: null,
    direction: null,

    /**
     *
     */
    constructor() {
      calcite.init();
    },

    /**
     *
     * @param boilerplateResponse
     */
    init: function (boilerplateResponse) {
      if(boilerplateResponse) {
        this.direction = boilerplateResponse.direction;
        this.config = boilerplateResponse.config;
        this.settings = boilerplateResponse.settings;
        const boilerplateResults = boilerplateResponse.results;
        const webMapItem = boilerplateResults.webMapItem;
        const webSceneItem = boilerplateResults.webSceneItem;
        const groupData = boilerplateResults.group;

        document.documentElement.lang = boilerplateResponse.locale;

        this.urlParamHelper = new UrlParamHelper();
        this.itemHelper = new ItemHelper();

        this._setDirection();

        if(webMapItem) {
          this._createWebMap(webMapItem);
        } else if(webSceneItem) {
          this._createWebScene(webSceneItem);
        } else if(groupData) {
          this._createGroupGallery(groupData);
        } else {
          this.reportError(new Error("app:: Could not load an item to display"));
        }
      }
      else {
        this.reportError(new Error("app:: Boilerplate is not defined"));
      }
    },

    /**
     *
     * @param error
     * @returns {*}
     */
    reportError: function (error) {
      // remove loading class from body
      //domClass.remove(document.body, CSS.loading);
      //domClass.add(document.body, CSS.error);
      // an error occurred - notify the user. In this example we pull the string from the
      // resource.js file located in the nls folder because we've set the application up
      // for localization. If you don't need to support multiple languages you can hardcode the
      // strings here and comment out the call in index.html to get the localization strings.
      // set message
      let node = dom.byId("loading_message");
      if(node) {
        //node.innerHTML = "<h1><span class=\"" + CSS.errorIcon + "\"></span> " + i18n.error + "</h1><p>" + error.message + "</p>";
        node.innerHTML = "<h1><span></span>" + i18n.error + "</h1><p>" + error.message + "</p>";
      }
      return error;
    },

    /**
     *
     * @private
     */
    _setDirection: function () {
      let direction = this.direction;
      let dirNode = document.getElementsByTagName("html")[0];
      domAttr.set(dirNode, "dir", direction);
    },

    /**
     *
     * @param webMapItem
     * @private
     */
    _createWebMap: function (webMapItem) {
      this.itemHelper.createWebMap(webMapItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webmap.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/MapView"], function (MapView) {

          let view = new MapView(viewProperties);
          view.when(function (response) {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);

        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param webSceneItem
     * @private
     */
    _createWebScene: function (webSceneItem) {
      this.itemHelper.createWebScene(webSceneItem).then(function (map) {

        let viewProperties = {
          map: map,
          container: this.settings.webscene.containerId
        };

        if(!this.config.title && map.portalItem && map.portalItem.title) {
          this.config.title = map.portalItem.title;
        }

        lang.mixin(viewProperties, this.urlParamHelper.getViewProperties(this.config));
        require(["esri/views/SceneView"], function (SceneView) {

          let view = new SceneView(viewProperties);
          view.when(function (response) {
            this.urlParamHelper.addToView(view, this.config);
            this._ready(view);
          }.bind(this), this.reportError);
        }.bind(this));
      }.bind(this), this.reportError);
    },

    /**
     *
     * @param groupData
     * @private
     */
    _createGroupGallery: function (groupData) {
      let groupInfoData = groupData.infoData;
      let groupItemsData = groupData.itemsData;

      if(!groupInfoData || !groupItemsData || groupInfoData.total === 0 || groupInfoData instanceof Error) {
        this.reportError(new Error("app:: group data does not exist."));
        return;
      }

      let info = groupInfoData.results[0];
      let items = groupItemsData.results;

      this._ready();

      if(info && items) {
        let html = "";

        html += "<h1>" + info.title + "</h1>";

        html += "<ol>";

        items.forEach(function (item) {
          html += "<li>" + item.title + "</li>";
        });

        html += "</ol>";

        document.body.innerHTML = html;
      }

    },

    /**
     *
     * @private
     */
    _ready: function (view) {

      // TITLE //
      document.title = dom.byId("app-title-node").innerHTML = this.config.title;

      //
      // WIDGETS IN VIEW UI //
      //

      // HOME //
      const homeWidget = new Home({ view: view });
      view.ui.add(homeWidget, { position: "top-left", index: 0 });

      // COMPASS //
      // if(view.type === "2d") {
      //   const compass = new Compass({ view: view });
      //   view.ui.add(compass, "top-left");
      // }

      // SCALEBAR //
      const scaleBar = new ScaleBar({ view: view, unit: "dual" });
      view.ui.add(scaleBar, { position: "bottom-left" });

      // LEGEND //
      const legend = new Legend({
        view: view,
        container: domConstruct.create("div", { className: "font-size--3" })
      });
      const legendExpand = new Expand({
        view: view,
        content: legend.domNode,
        expandIconClass: "esri-icon-layer-list",
        expandTooltip: "Legend"
      }, domConstruct.create("div"));
      view.ui.add(legendExpand, "bottom-right");

      // PRINT //
      const printServiceUrl = this.config.helperServices.printTask.url;
      if(printServiceUrl && (printServiceUrl.length > 0)) {
        const print = new Print({
          view: view,
          printServiceUrl: printServiceUrl,
          templateOptions: { title: "Heat Events and Social Vulnerability - " + this.config.title }
        }, "print-node");
        this.setPrintTitle = (title) => {
          print.templateOptions.title = "Heat Events and Social Vulnerability - " + title;
        };
      } else {
        domClass.add("print-action-node", "hide");
      }

      // INITIALIZE SOCIAL VULNERABILITY INDEX LAYERS //
      this.initializeSVILayers(view);
    },


    /**
     *
     * @param view
     * @param layerInfo
     * @returns {Promise}
     * @private
     */
    _getLayer: function (view, layerInfo) {
      const layerInMap = view.map.layers.find((layer) => {
        return (layer.title === layerInfo.layerName);
      });
      if(layerInMap != null) {
        return layerInMap.load().then(() => {
          return layerInMap;
        });
      } else {
        return Layer.fromPortalItem(layerInfo.portalItem).then((layer) => {
          return layer.load().then(() => {
            return layer;
          });
        });
      }
    },

    /**
     * INITIALIZE SOCIAL VULNERABILITY INDEX LAYERS
     *
     * - https://svi.cdc.gov/Documents/Data/2014_SVI_Data/SVI2014Documentation.pdf
     *
     * @param view
     */
    initializeSVILayers: function (view) {

      /**
       *
       * @param layer
       * @returns {boolean}
       */
      this.visibleAtCurrentScale = (layer) => {
        return (layer.minScale && (layer.minScale > view.scale)) || (layer.maxScale && (layer.maxScale < view.scale));
      };


      // SVI THEMES //
      this.SVIThemeInfos = this.config.SVIInfos.themes;
      // GROUP LAYER INFOS //
      this.groupLayerInfos = this.config.SVIInfos.groupLayerInfos;

      // LOAD ALL LAYERS //
      const allLayerHandles = this.groupLayerInfos.reduce((layerHandles, groupLayerInfo) => {

        const groupMenuItem = domConstruct.create("span", { className: "dropdown-title", innerHTML: groupLayerInfo.title }, "items-menu");

        const groupLayer = new GroupLayer({
          title: groupLayerInfo.title,
          visibilityMode: "exclusive"
        });
        view.map.add(groupLayer, 2);

        return groupLayerInfo.layerInfos.reduce((layerHandles, layerInfo) => {

          domConstruct.create("a", {
            href: lang.replace("https://www.arcgis.com/home/item.html?id={id}", layerInfo.portalItem),
            target: "_blank",
            className: "dropdown-link " + layerInfo.theme + "-menu-item",
            role: "menu-item",
            innerHTML: layerInfo.title
          }, groupMenuItem, "after");

          const layerHandle = this._getLayer(view, layerInfo).then((layer) => {

            // UPDATE LAYER //
            layer.outFields = ["*"];
            layer.theme = layerInfo.theme;
            layer.title = layerInfo.title;
            layer.visible = layerInfo.visible;
            layer.minScale = groupLayerInfo.minScale;
            layer.maxScale = groupLayerInfo.maxScale;
            layer.popupTemplate = null;
            layer.popupEnabled = false;
            layer.renderer.legendOptions = { title: "Summary Ranking" };
            // UPDATE RENDERER SYMBOLS - REMOVE OUTLINES //
            layer.renderer.classBreakInfos.forEach((classBreakInfo) => {
              classBreakInfo.symbol.outline.width = 0.5;
            });

            // ADD LAYER TO GROUP LAYER //
            groupLayer.add(layer);

            this.SVIThemeInfos[layerInfo.theme].layers.push(layer);

            return layer;
          });

          return layerHandles.concat(layerHandle);
        }, layerHandles);
      }, []);

      // WAIT FOR ALL LAYERS TO BE LOADED //
      promiseUtils.eachAlways(allLayerHandles).then(() => {
        // WAIT FOR LAYERS TO FINISH UPDATING //
        watchUtils.whenFalseOnce(view, "updating", () => {

          // INITIALIZE TOP 10 LAYER //
          this.initializeTop10Layer(view);

          // INITIALIZE THEME BUTTONS //
          this.initializeThemeButtons(view);

          // UPDATE LISTS WHEN VIEW EXTENT CHANGES //
          watchUtils.init(view, "extent", (extent) => {
            this.updateVulnerableLists(view, extent, true);
          });

          // INITIALIZE FILTER //
          this.initializeStateCountyFilter(view);

          // MAP CLICK //
          view.on("click", (evt) => {
            view.hitTest({ x: evt.x, y: evt.y }).then((response) => {
              const visibleLayerResult = response.results.find((result) => {
                return (result.graphic.layer && result.graphic.layer.visible && !result.graphic.layer.title.startsWith("Top 10"));
              });
              if(visibleLayerResult) {
                const feature = visibleLayerResult.graphic;
                this.displayDetails(feature);
                query(".vulnerable-item").removeClass("is-active");
                query(lang.replace(".theme-list.is-active .vulnerable-item[data-id='{id}']", {
                  id: feature.getAttribute("AFFGEOID")
                })).addClass("is-active");
              }
            });
          });

        });
      });

    },

    /**
     *
     * @param view
     */
    initializeTop10Layer: function (view) {

      // SELECTED SYMBOL //
      const selectedSymbol = new SimpleFillSymbol({
        style: "solid",
        color: Color.named.transparent,
        outline: {
          color: Color.named.cyan.concat(0.8),
          width: 1.5
        }
      });
      /*const simpleRenderer = new SimpleRenderer({
        symbol: new SimpleFillSymbol({
          style: "solid",
          color: Color.named.transparent,
          outline: {
            color: Color.named.red,
            width: 2.0
          }
        })
      });*/

      const top10SymbolsJson = JSON.parse(Top10SymbolsText);
      const top10UniqueValueInfos = top10SymbolsJson.red.map((symbolInfo, symbolInfoIndex) => {
        return {
          value: symbolInfoIndex,
          symbol: new PictureMarkerSymbol(symbolInfo)
        }
      });
      const top10Renderer = new UniqueValueRenderer({
        field: "rank",
        //defaultSymbol: selectedSymbol,
        uniqueValueInfos: top10UniqueValueInfos
      });

      // TOP 10 LAYER //
      const top10Layer = new FeatureLayer({
        title: "Top 10 Most Vulnerable",
        objectIdField: "OBJECTID",
        geometryType: "polygon",
        spatialReference: view.spatialReference,
        fields: [
          {
            name: "OBJECTID",
            alias: "OBJECTID",
            type: "oid"
          },
          {
            name: "rank",
            alias: "Rank",
            type: "integer"
          }
        ],
        source: [],
        popupEnabled: false,
        legendEnabled: false,
        renderer: top10Renderer
      });
      view.map.add(top10Layer);


      // SELECTED GRAPHIC //
      //let selectedGraphic = new Graphic({ attributes: { rank: 0 } });
      let selectedGraphic = new Graphic({ symbol: selectedSymbol });
      this.updateSelectedGraphic = (feature) => {
        top10Layer.source.remove(selectedGraphic);
        selectedGraphic = selectedGraphic.clone();
        selectedGraphic.geometry = feature.geometry.clone();
        top10Layer.source.add(selectedGraphic);

        /*const addIndex = 0; //top10Layer.source.length;
        top10Layer.source.add(selectedGraphic, addIndex);
        let selectedIndex = top10Layer.source.findIndex(graphic => {
          return (graphic === selectedGraphic);
        });*/
        //console.info("addIndex:", addIndex, "selectedIndex:", selectedIndex);

        /*const moveIndex = top10Layer.source.length;
        top10Layer.source.reorder(selectedGraphic, moveIndex);
        selectedIndex = top10Layer.source.findIndex(graphic => {
          return (graphic === selectedGraphic);
        });*/
        //console.info("moveIndex:", moveIndex, "selectedIndex:", selectedIndex);

      };
      this.addHighlightedGraphic = (feature, rank) => {
        const highlightedGraphic = new Graphic({ geometry: feature.geometry.clone(), attributes: { rank: rank } });
        top10Layer.source.add(highlightedGraphic);
      };
      this.clearGraphics = () => {
        top10Layer.source.removeAll();
      };

    },

    /**
     *
     * @param view
     */
    initializeStateCountyFilter: function (view) {

      // SEARCH WIDGET //
      const searchWidget = new Search({
        view: view,
        allPlaceholder: "Filter by State or County",
        autoSelect: false
      });
      view.ui.add(searchWidget, { position: "top-right", index: 0 });

      //const esriWorldLocator = searchWidget.sources.getItemAt(0);
      //esriWorldLocator.countryCode = "US";
      //esriWorldLocator.categories = ["Populated Place"];

      // COUNTY LAYER //
      const countiesLayer = view.map.layers.find((layer) => {
        return (layer.title === "USA Counties");
      });
      // COUNTY SEARCH SOURCE //
      const countiesSource = {
        featureLayer: countiesLayer,
        searchFields: ["NAME"],
        displayField: "NAME",
        exactMatch: false,
        outFields: ["*"],
        suggestionTemplate: "{NAME}, {STATE_NAME}",
        name: "USA Counties",
        placeholder: "Filter by County"
      };

      // STATE LAYER //
      const statesLayer = view.map.layers.find((layer) => {
        return (layer.title === "USA States");
      });
      // STATE SEARCH SOURCE //
      const statesSource = {
        featureLayer: statesLayer,
        searchFields: ["STATE_NAME"],
        displayField: "STATE_NAME",
        exactMatch: false,
        outFields: ["*"],
        name: "USA States",
        placeholder: "Filter by State"
      };
      // SET SEARCH SOURCES //
      searchWidget.sources = [statesSource, countiesSource];

      // RESET FILTER WHEN SEARCH IS CLEARED //
      searchWidget.on("search-clear", (evt) => {
        this.applyStateCountyFilter(view, "1=1");
      });

      // SEARCH COMPLETE //
      searchWidget.on("search-complete", (evt) => {

        // LAYER FILTER //
        let filter = "1=1";

        // DO WE HAVE RESULTS //
        if(evt.numResults > 0) {
          // SEARCH RESULT //
          const result = evt.results["0"].results["0"];

          // STATE NAME //
          const stateName = result.feature.attributes["STATE_NAME"];
          // FILTERING BY STATE //
          filter = lang.replace("(STATE = ' {state}' OR STATE = '{state}')", { state: stateName });

          // FILTERING BY COUNTY //
          if(result.sourceIndex === 1) {
            const countyName = result.feature.attributes["NAME"];
            filter += lang.replace(" AND (COUNTY = ' {county}' OR COUNTY = '{county}')", { state: stateName, county: countyName });
          }

          // GO TO LOCATION //
          view.goTo({ target: result.extent.expand(1.2) }).then(() => {
            // APPLY STATE/COUNTY FILTER //
            this.applyStateCountyFilter(view, filter);
          });

        } else {
          // RESET FILTER //
          this.applyStateCountyFilter(view, filter);
        }
      });

    },

    /**
     *
     * @param view
     * @param filter
     */
    applyStateCountyFilter: function (view, filter) {
      view.map.allLayers.forEach((layer) => {
        if(!layer.title.startsWith("USA")) {
          layer.definitionExpression = filter;
        }
      });
      watchUtils.whenFalseOnce(view, "updating", () => {
        this.updateVulnerableLists(view, view.extent, true);
      });
    },

    /**
     *
     * @param view
     */
    initializeThemeButtons: function (view) {

      Object.keys(this.SVIThemeInfos).map((themeName) => {
        on(dom.byId(themeName + "-btn"), "click", () => {
          this.makeThemeActive(view, themeName, true);
        });
      });
      this.makeThemeActive(view, "THEMES", true);

    },

    /**
     *
     * @param view
     * @param themeName
     * @param selectFirst
     */
    makeThemeActive: function (view, themeName, selectFirst) {
      view.popup.close();

      const theme = this.SVIThemeInfos[themeName];
      theme.layers.forEach((layer) => {
        layer.visible = true;
      });

      this.setPrintTitle(theme.title);

      const themeButtonNode = dom.byId(themeName + "-btn");
      query(".theme-btn").removeClass("is-active");
      domClass.add(themeButtonNode, "is-active");
      query(".theme-list").removeClass("is-active");
      domClass.add(themeName + "-list", "is-active");

      this.updateVulnerableLists(view, view.extent, selectFirst);
    },

    /**
     *
     * @param view
     * @param extent
     * @param selectFirst
     */
    updateVulnerableLists: function (view, extent, selectFirst) {

      if(this.queryHandles) {
        this.queryHandles.forEach((queryHandle) => {
          if(!queryHandle.isFulfilled()) {
            queryHandle.cancel();
          }
        });
      }

      const visibleLayer = view.map.allLayers.find((layer) => {
        return layer.visible && this.visibleAtCurrentScale(layer);
      });
      if(visibleLayer) {
        const overallLayer = visibleLayer.parent.layers.find((layer) => {
          return (layer.title === "Overall");
        });
        this.clearGraphics();

        this.queryHandles = Object.keys(this.SVIThemeInfos).map((themeName) => {
          return this.updateVulnerableList(view, overallLayer, extent, themeName, selectFirst);
        });

      }
    },

    /**
     *
     * @param view
     * @param overallLayer
     * @param searchArea
     * @param themeName
     * @param selectFirst
     */
    updateVulnerableList: function (view, overallLayer, searchArea, themeName, selectFirst) {

      const searchField = "RPL_" + themeName;
      const listNode = themeName + "-list";
      const isActive = domClass.contains(dom.byId(themeName + "-btn"), "is-active");

      const mostVulnerableQuery = overallLayer.createQuery();
      mostVulnerableQuery.geometry = searchArea;
      //mostVulnerableQuery.spatialRelationship = "contains";
      mostVulnerableQuery.orderByFields = [searchField + " DESC"];
      mostVulnerableQuery.num = 10;

      return overallLayer.queryFeatures(mostVulnerableQuery).then((nearbyFeatureSet) => {

        domConstruct.empty(listNode);
        const vulnerableItemNodes = nearbyFeatureSet.features.map((feature, featureIndex) => {


          const vulnerableItemNode = domConstruct.create("li", {
            className: "vulnerable-item",
            "data-theme": themeName,
            "data-id": feature.getAttribute("AFFGEOID"),
            innerHTML: feature.getAttribute("LOCATION"),
            title: feature.getAttribute(searchField).toFixed(3)
          }, listNode);


          on(vulnerableItemNode, "click", () => {
            query(".vulnerable-item").removeClass("is-active");
            domClass.add(vulnerableItemNode, "is-active");
            this.displayDetails(feature);
          });

          if(isActive) {
            this.addHighlightedGraphic(feature, featureIndex + 1);
          }

          return vulnerableItemNode;
        });

        if(isActive && selectFirst) {
          vulnerableItemNodes[0].click();
        }

      });

    },

    /**
     *
     * @param feature
     */
    displayDetails: function (feature) {

      this.updateSelectedGraphic(feature);

      //domConstruct.create("pre", {
      //  className: "",
      //  innerHTML: JSON.stringify(feature.attributes, null, "  ")
      //}, "selected-item-node", "only");


      dom.byId("selected-item-label").innerHTML = feature.getAttribute("LOCATION");
      dom.byId("selected-item-score").innerHTML = feature.getAttribute("RPL_THEMES").toFixed(3);

      dom.byId("selected-item-pop").innerHTML = number.format(+feature.getAttribute("E_TOTPOP"));
      dom.byId("selected-item-day-pop").innerHTML = number.format(+feature.getAttribute("E_DAYPOP"));
      dom.byId("selected-item-hu").innerHTML = number.format(+feature.getAttribute("E_HU"));
      dom.byId("selected-item-hh").innerHTML = number.format(+feature.getAttribute("E_HH"));


      const themeData = Object.keys(this.SVIThemeInfos).filter((themeName) => {
        return (themeName !== "THEMES");
      }).map((themeName) => {
        const theme = this.SVIThemeInfos[themeName];
        const value = +feature.getAttribute("RPL_" + themeName);
        //const flags = +feature.getAttribute("F_" + themeName);
        return {
          y: value,
          text: value.toFixed(3),
          fill: theme.color,
          stroke: { color: "#fff" },
          //stroke: { color: (flags > 0) ? "red" : "transparent", width: (flags > 0) ? 2 : 2 },
          tooltip: theme.title
        };
      });


      // const nodePosition = (nodeId) => {
      //   const nodePositionInfo = domGeom.position(dom.byId(nodeId));
      // console.info(nodeId, nodePositionInfo);
      // };

      domConstruct.empty("chart_THEMES");
      //nodePosition("chart_THEMES");
      const chart_THEMES = new Chart("chart_THEMES");
      chart_THEMES.setTheme(ChartTheme);
      chart_THEMES.fill = chart_THEMES.theme.plotarea.fill = "transparent";
      chart_THEMES.addPlot("default", {
        type: PiePlot,
        fontColor: "#fff",
        labelOffset: 20,
        radius: 80
      });
      chart_THEMES.addSeries("Themes", themeData.reverse());
      const anim_HL = new ChartHighlight(chart_THEMES, "default", { highlight: "red" });
      const anim_TT = new ChartTooltip(chart_THEMES, "default");
      chart_THEMES.render();


      Object.keys(this.SVIThemeInfos).filter((themeName) => {
        return (themeName !== "THEMES");
      }).forEach((themeName) => {
        domConstruct.empty("chart_" + themeName);

        const theme = this.SVIThemeInfos[themeName];
        const themeData = theme.chartFields.map((chartField, chartFieldIndex) => {
          const fieldName = chartField.name;
          const value = +feature.getAttribute(fieldName);
          //const flags = +feature.getAttribute("F_" + fieldName.replace(/EPL_/, ""));
          return {
            x: chartFieldIndex + 1,
            y: value,
            tooltip: chartField.alias,
            stroke: { color: "white" }
            //stroke: { color: (flags > 0) ? "red" : "white", width: (flags > 0) ? 2 : 1 }
          }
        });


        //nodePosition("chart_" + themeName);
        const themeChart = new Chart("chart_" + themeName, {
          /*title: theme.title,
           titleGap: 5,
           titleFont: "normal normal bold 9pt Avenir Next W01",
           titleFontColor: theme.color*/
        });
        themeChart.setTheme(ChartTheme);
        themeChart.fill = themeChart.theme.plotarea.fill = "transparent";
        themeChart.addPlot("default", {
          type: ColumnsPlot,
          labels: true,
          fontColor: "#fff",
          precision: 4,
          gap: 2
        });
        themeChart.addAxis("x", {
          minorTicks: false,
          stroke: theme.color,
          fontColor: theme.color,
          majorTick: { color: theme.color, length: 6 },
          labelFunc: (text, value) => {
            return theme.chartFields[value - 1].name.replace(/EPL_/, "");
          }
        });
        themeChart.addSeries(ChartTheme, themeData, { fill: theme.color, stroke: { color: "#fff" }, min: 0.0, max: 1.0 });

        const themeAnimHL = new ChartHighlight(themeChart, "default", { highlight: "red" });
        const themeAnimTT = new ChartTooltip(themeChart, "default");

        themeChart.render();


        /**
         * Flags
         *
         * Counties in the top 10%, i.e., at the 90th percentile of values, are given a value of 1 to indicate high
         * vulnerability. Counties below the 90th percentile are given a value of 0.  For a theme, the flag value is
         * the number of flags for variables comprising the theme. We calculated the overall flag value for each
         * county as the number of all variable flags.
         *
         */

      });

    }

  });
});