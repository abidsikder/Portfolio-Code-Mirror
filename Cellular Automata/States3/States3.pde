import java.util.HashMap;

class CA
{
  int[] cells;
  HashMap<Integer, HashMap<Integer, HashMap<Integer, Integer>>> ruleset;
  // width in pixels
  int cellWidth = 5;
  int generation = 0;
  String name;
  
  CA()
  {
    cells = new int[width/cellWidth];
    ruleset = new HashMap<Integer, HashMap<Integer, HashMap<Integer, Integer>>>();

    // make the name while building the ruleset
    StringBuilder nameBuilder = new StringBuilder();

    // make a random ruleset
    for (int i = 0; i < 3; i++)
    {
      ruleset.put(i, new HashMap<Integer, HashMap<Integer, Integer>>());
      // initialize the ruleset for the medium level
      for (int j = 0; j < 3; j++)
      {
        ruleset.get(i).put(
          j, new HashMap<Integer, Integer>()
        );
        // initialize a random rule for the bottom level
        for (int k = 0; k < 3; k++)
        {
          ruleset.get(i).get(j).put(
            k, int(random(3))
          );
          nameBuilder.append(ruleset.get(i).get(j).get(k));
          // i is left cell, j is middle cell, and k is right cell
        }
      }
    }

    // make the name for the cellular automaton based on the ruleset
    name = nameBuilder.toString();

    for (int i = 0; i < cells.length; i++)
    {
      cells[i] =  int(random(3));
    }
  }

  void generate()
  {
    int[] nextgen = new int[cells.length];
    for (int i = 1; i < cells.length-1; i++)
    {
      int left   = cells[i-1];
      int middle = cells[i];
      int right  = cells[i+1];
      nextgen[i] = rules(left, middle, right);
    }
    cells = nextgen;
    generation++;
  }

  int rules(int a, int b, int c) 
  {
    return ruleset.get(a).get(b).get(c);
  }

  void display()
  {
    colorMode(RGB);
    noStroke();
    for (int i = 0; i < cells.length; i++) {
      switch(cells[i])
      {
        case 0:
          fill(242,65,80, 255);
          break;
        case 1:
          fill(31,175,191, 255);
          break;
        case 2:
          fill(89,89,89, 255);
          break;
        default:
          println("Uh oh something went wrong");
          break;
      }
      // Set the y-location according to the generation.
      rect(i*cellWidth, generation*cellWidth, cellWidth, cellWidth);
    }
  }

}

CA auto;
int yCounter = 0;

void setup()
{
  size(1500, 1000);
  auto = new CA();
}

void draw()
{
  auto.display();
  auto.generate();
  auto.display();
  yCounter += auto.cellWidth;

  // when it reaches the bottom of the window, save the full image
  if (yCounter > height)
  {
    save("states3CA_" + auto.name + ".png");
    println(auto.name);

    auto = new CA();
    yCounter = 0;
  }
}
