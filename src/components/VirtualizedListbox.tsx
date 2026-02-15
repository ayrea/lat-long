import { FixedSizeList as List } from "react-window";
import React from "react";

const LISTBOX_PADDING = 8;
const ROW_HEIGHT = 52;
const VISIBLE_ROWS = 8;
const LIST_HEIGHT = ROW_HEIGHT * VISIBLE_ROWS + 2 * LISTBOX_PADDING;

type ListboxProps = React.HTMLAttributes<HTMLUListElement> & { children?: React.ReactNode };

/**
 * Virtualized listbox for MUI Autocomplete. Use as slots.listbox to avoid
 * rendering thousands of options at once.
 */
export const VirtualizedListbox = React.forwardRef<HTMLUListElement, ListboxProps>(
  function VirtualizedListbox(props, ref) {
    const { children, ...other } = props;
    const childArray = React.Children.toArray(children);

    return (
      <ul ref={ref} {...other} style={{ padding: 0, margin: 0, listStyle: "none", height: LIST_HEIGHT }}>
        <List
          height={LIST_HEIGHT}
          width="100%"
          itemCount={childArray.length}
          itemSize={ROW_HEIGHT}
          overscanCount={8}
          style={{ overflowX: "hidden" }}
        >
          {({ index, style }) => {
            const child = childArray[index];
            if (!child || !React.isValidElement(child)) return null;
            return React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
              style: { ...style, top: (style.top as number) + LISTBOX_PADDING },
            });
          }}
        </List>
      </ul>
    );
  }
);
