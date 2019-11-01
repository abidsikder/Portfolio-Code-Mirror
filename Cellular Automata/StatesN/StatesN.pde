import java.util.HashMap;

class CA
{
  int[] cells;
  HashMap<Integer, HashMap<Integer, HashMap<Integer, Integer>>> ruleset;
  // width in pixels
  int cellWidth = 5;
  int generation = 0;
  int n;
  String name;
  
  CA(int n)
  {
    cells = new int[width/cellWidth];
    ruleset = new HashMap<Integer, HashMap<Integer, HashMap<Integer, Integer>>>();

    // make the name while building the ruleset
    StringBuilder nameBuilder = new StringBuilder();

    // make a random ruleset
    // initialize the ruleset for the top level
    for (int i = 0; i < n; i++)
    {
      ruleset.put(i, new HashMap<Integer, HashMap<Integer, Integer>>());
      // initialize the ruleset for the medium level
      for (int j = 0; j < n; j++)
      {
        ruleset.get(i).put(
          j, new HashMap<Integer, Integer>()
        );
        // initialize a random rule for the bottom level
        for (int k = 0; k < n; k++)
        {
          ruleset.get(i).get(j).put(
            k, int(random(n))
          );
          nameBuilder.append(ruleset.get(i).get(j).get(k));
        }
      }
    }

    // make the name for the cellular automaton based on the ruleset
    name = nameBuilder.toString();

    for (int i = 0; i < cells.length; i++)
    {
      cells[i] =  int(random(n));
    }
  }

  void generate()
  {
    int[] nextgen = new int[cells.length];
    for (int i = 1; i < cells.length-1; i++)
    {
      int left   = cells[i-1];
      int me     = cells[i];
      int right  = cells[i+1];
      nextgen[i] = rules(left, me, right);
    }
    cells = nextgen;
    // Increment the generation counter.
    generation++;
  }

  int rules(int a, int b, int c) 
  {
    return ruleset.get(a).get(b).get(c);
  }

  void display()
  {
    colorMode(HSB);
    noStroke();
    for (int i = 0; i < cells.length; i++) {
      // change color scheme here
      fill(360/nth * cells[i], 255, 255, 255);
      // Set the y-location according to the generation.
      rect(i*cellWidth, generation*cellWidth, cellWidth, cellWidth);
    }
  }

}

CA auto;
int yCounter = 0;
// enter in the number of possible cell states you'd like
int nth = 5;

void setup()
{
  size(1500, 1000);
  auto = new CA(nth);
}

void draw()
{
  auto.display();
  auto.generate();
  auto.display();
  yCounter += auto.cellWidth;
  if (yCounter > height)
  {
    save("states" + nth + "CA_" + auto.name + ".png");
    auto = new CA(nth);
    yCounter = 0;
  }
}
